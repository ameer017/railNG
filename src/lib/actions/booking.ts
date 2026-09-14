"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma, TravelClass } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { HOLD_MINUTES, releaseExpiredHolds } from "@/lib/holds";
import { paymentProvider } from "@/lib/payments";
import { isUniqueConflict } from "@/lib/prisma-errors";
import { assignSeats } from "@/lib/seats";
import { requireUser } from "@/lib/session";
import { bookingReference } from "@/lib/utils";

const createBookingSchema = z.object({
  tripId: z.string().min(1),
  travelClass: z.enum(["ECONOMY", "BUSINESS", "FIRST"]),
  passengers: z
    .array(
      z.object({
        fullName: z.string().min(2, "Enter each passenger's name"),
        phone: z.string().optional(),
      }),
    )
    .min(1)
    .max(6),
});

export type BookingState = { error?: string };

function actionError(error: unknown, fallback: string) {
  if (error instanceof Error) return { error: error.message };
  return { error: fallback };
}

export async function createBookingAction(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const session = await requireUser();
  const tripId = String(formData.get("tripId") ?? "");
  const travelClass = String(formData.get("travelClass") ?? "") as TravelClass;
  const count = Number(formData.get("passengerCount") ?? 1);

  const passengers = Array.from({ length: Math.min(Math.max(count, 1), 6) }, (_, i) => ({
    fullName: String(formData.get(`passengerName_${i}`) ?? "").trim(),
    phone: String(formData.get(`passengerPhone_${i}`) ?? "").trim() || undefined,
  }));

  const parsed = createBookingSchema.safeParse({ tripId, travelClass, passengers });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check passenger details" };
  }

  const partySize = parsed.data.passengers.length;
  let bookingId = "";

  try {
    bookingId = await prisma.$transaction(async (tx) => {
      await releaseExpiredHolds(tx);

      const fare = await tx.fare.findUnique({
        where: {
          tripId_travelClass: {
            tripId: parsed.data.tripId,
            travelClass: parsed.data.travelClass,
          },
        },
        include: { trip: true },
      });

      if (!fare) throw new Error("This trip is no longer available.");
      if (fare.trip.status !== "SCHEDULED" && fare.trip.status !== "BOARDING") {
        throw new Error("This trip is no longer available.");
      }
      if (fare.trip.departsAt.getTime() <= Date.now()) throw new Error("This train has already departed.");

      const held = await tx.fare.updateMany({
        where: { id: fare.id, remainingSeats: { gte: partySize } },
        data: { remainingSeats: { decrement: partySize } },
      });
      if (held.count !== 1) throw new Error("Not enough seats left in this class.");

      try {
        return await insertBooking(tx, {
          userId: session.user.id,
          fare,
          passengers: parsed.data.passengers,
        });
      } catch (error) {
        await tx.fare.update({
          where: { id: fare.id },
          data: { remainingSeats: { increment: partySize } },
        });
        throw error;
      }
    });
  } catch (error) {
    return actionError(error, "Could not hold seats");
  }

  redirect(`/checkout/${bookingId}`);
}

async function insertBooking(
  tx: Prisma.TransactionClient,
  input: {
    userId: string;
    fare: { id: string; tripId: string; travelClass: TravelClass; priceKobo: number };
    passengers: { fullName: string; phone?: string }[];
  },
) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      const booking = await tx.booking.create({
        data: {
          reference: bookingReference(),
          userId: input.userId,
          tripId: input.fare.tripId,
          fareId: input.fare.id,
          travelClass: input.fare.travelClass,
          amountKobo: input.fare.priceKobo * input.passengers.length,
          status: "PENDING",
          heldUntil: new Date(Date.now() + HOLD_MINUTES * 60_000),
          passengers: {
            create: input.passengers.map((passenger) => ({
              fullName: passenger.fullName,
              phone: passenger.phone,
            })),
          },
        },
      });
      return booking.id;
    } catch (error) {
      if (!isUniqueConflict(error) || attempt === 7) throw error;
    }
  }

  throw new Error("Could not hold seats");
}

export async function payBookingAction(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const session = await requireUser();
  const bookingId = String(formData.get("bookingId") ?? "");

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      userId: true,
      status: true,
      reference: true,
      amountKobo: true,
      heldUntil: true,
      paymentId: true,
      user: { select: { email: true } },
    },
  });

  if (!booking || booking.userId !== session.user.id) {
    return { error: "Booking not found." };
  }
  if (booking.status === "PAID") {
    redirect(`/ticket/${booking.reference}`);
  }
  if (booking.status !== "PENDING") {
    return { error: "This booking is no longer payable." };
  }
  if (booking.heldUntil && booking.heldUntil.getTime() < Date.now()) {
    return { error: "Your seat hold expired. Search again to book." };
  }

  let paymentId = booking.paymentId;
  if (!paymentId) {
    const charge = await paymentProvider.charge({
      amountKobo: booking.amountKobo,
      reference: booking.reference,
      email: booking.user.email,
    });
    if (!charge.success) {
      return { error: "Payment failed. Your seats are still held — try again." };
    }
    paymentId = charge.paymentId;
    await prisma.booking.updateMany({
      where: { id: booking.id, status: "PENDING", paymentId: null },
      data: { paymentId },
    });
  }

  let paid = "";
  try {
    paid = await prisma.$transaction(async (tx) => {
      await releaseExpiredHolds(tx, bookingId);

      const fresh = await tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          passengers: true,
          trip: { include: { origin: true, destination: true } },
        },
      });

      if (!fresh || fresh.userId !== session.user.id) throw new Error("Booking not found.");
      if (fresh.status === "PAID") return fresh.reference;
      if (fresh.status !== "PENDING") throw new Error("This booking is no longer payable.");

      const existing = await tx.ticket.findMany({
        where: {
          booking: { tripId: fresh.tripId, travelClass: fresh.travelClass, status: "PAID" },
        },
        select: { coach: true, seat: true },
      });
      const taken = new Set(existing.map((ticket) => `${ticket.coach}-${ticket.seat}`));
      const seats = assignSeats(fresh.travelClass, taken, fresh.passengers.length);

      await tx.booking.update({
        where: { id: fresh.id },
        data: {
          status: "PAID",
          paymentId,
          heldUntil: null,
          tickets: {
            create: fresh.passengers.map((passenger, index) => {
              const seat = seats[index];
              return {
                passengerId: passenger.id,
                coach: seat.coach,
                seat: seat.seat,
                qrPayload: [
                  "RAILNG",
                  fresh.reference,
                  passenger.fullName,
                  fresh.trip.origin.code,
                  fresh.trip.destination.code,
                  seat.coach,
                  seat.seat,
                ].join("|"),
              };
            }),
          },
        },
      });

      return fresh.reference;
    });
  } catch (error) {
    return actionError(error, "Payment failed");
  }

  revalidatePath("/bookings");
  redirect(`/ticket/${paid}`);
}

export async function cancelOwnBookingAction(bookingId: string) {
  const session = await requireUser("/bookings");

  await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: { trip: true, _count: { select: { passengers: true } } },
    });
    if (!booking || booking.userId !== session.user.id) {
      throw new Error("Booking not found");
    }
    if (booking.status === "CANCELLED") return;
    if (booking.status === "PAID" && booking.trip.departsAt.getTime() < Date.now()) {
      throw new Error("This journey has already started.");
    }

    const cancelled = await tx.booking.updateMany({
      where: { id: booking.id, status: { not: "CANCELLED" } },
      data: { status: "CANCELLED", heldUntil: null },
    });
    if (cancelled.count !== 1) return;

    await tx.fare.update({
      where: { id: booking.fareId },
      data: { remainingSeats: { increment: booking._count.passengers } },
    });
  });

  revalidatePath("/bookings");
}
