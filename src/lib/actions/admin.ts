"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { TripStatus } from "@prisma/client";
import { z } from "zod";
import { fromDateTimeLocalWAT } from "@/lib/datetime";
import { nairaToKobo } from "@/lib/money";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

async function guardAdmin() {
  await requireAdmin();
}

const stationSchema = z.object({
  name: z.string().min(2),
  city: z.string().min(2),
  code: z.string().min(2).max(8).transform((value) => value.toUpperCase()),
});

export type AdminState = { error?: string; ok?: string };

export async function saveStationAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await guardAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = stationSchema.safeParse({
    name: formData.get("name"),
    city: formData.get("city"),
    code: formData.get("code"),
  });
  if (!parsed.success) return { error: "Name, city, and a short station code are required." };

  if (id) {
    try {
      await prisma.station.update({ where: { id }, data: parsed.data });
    } catch {
      return { error: "Could not save station. Code may already be in use." };
    }
    revalidatePath("/admin/stations");
    revalidatePath("/");
    redirect("/admin/stations");
  }

  try {
    await prisma.station.create({ data: parsed.data });
  } catch {
    return { error: "Could not save station. Code may already be in use." };
  }

  revalidatePath("/admin/stations");
  revalidatePath("/");
  redirect("/admin/stations");
}

export async function deleteStationAction(id: string) {
  await guardAdmin();
  const trips = await prisma.trip.count({
    where: { OR: [{ originId: id }, { destinationId: id }] },
  });
  if (trips > 0) {
    throw new Error("This station still has trips. Remove those first.");
  }
  await prisma.station.delete({ where: { id } });
  revalidatePath("/admin/stations");
}

const trainSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(8).transform((value) => value.toUpperCase()),
});

export async function saveTrainAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await guardAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = trainSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
  });
  if (!parsed.success) return { error: "Train name and code are required." };

  if (id) {
    try {
      await prisma.train.update({ where: { id }, data: parsed.data });
    } catch {
      return { error: "Could not save train. Code may already be in use." };
    }
    revalidatePath("/admin/trains");
    redirect("/admin/trains");
  }

  try {
    await prisma.train.create({ data: parsed.data });
  } catch {
    return { error: "Could not save train. Code may already be in use." };
  }

  revalidatePath("/admin/trains");
  redirect("/admin/trains");
}

export async function deleteTrainAction(id: string) {
  await guardAdmin();
  const trips = await prisma.trip.count({ where: { trainId: id } });
  if (trips > 0) {
    throw new Error("This train still has scheduled trips.");
  }
  await prisma.train.delete({ where: { id } });
  revalidatePath("/admin/trains");
}

const tripSchema = z.object({
  trainId: z.string().min(1),
  originId: z.string().min(1),
  destinationId: z.string().min(1),
  departsAt: z.string().min(1),
  arrivesAt: z.string().min(1),
  status: z.enum(["SCHEDULED", "BOARDING", "DEPARTED", "ARRIVED", "CANCELLED"]),
});

export async function saveTripAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await guardAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = tripSchema.safeParse({
    trainId: formData.get("trainId"),
    originId: formData.get("originId"),
    destinationId: formData.get("destinationId"),
    departsAt: formData.get("departsAt"),
    arrivesAt: formData.get("arrivesAt"),
    status: formData.get("status") ?? "SCHEDULED",
  });
  if (!parsed.success) return { error: "Fill in train, stations, and times." };
  if (parsed.data.originId === parsed.data.destinationId) {
    return { error: "Origin and destination must be different." };
  }

  const departsAt = fromDateTimeLocalWAT(parsed.data.departsAt);
  const arrivesAt = fromDateTimeLocalWAT(parsed.data.arrivesAt);
  if (Number.isNaN(departsAt.getTime()) || Number.isNaN(arrivesAt.getTime())) {
    return { error: "Enter valid departure and arrival times." };
  }
  if (arrivesAt <= departsAt) {
    return { error: "Arrival must be after departure." };
  }

  const status = parsed.data.status as TripStatus;
  const tripData = {
    trainId: parsed.data.trainId,
    originId: parsed.data.originId,
    destinationId: parsed.data.destinationId,
    departsAt,
    arrivesAt,
    status,
  };

  if (id) {
    try {
      await prisma.trip.update({ where: { id }, data: tripData });
    } catch {
      return { error: "Could not save trip." };
    }
    revalidatePath("/admin/trips");
    revalidatePath("/");
    redirect("/admin/trips");
  }

  const economy = Number(formData.get("economyNaira") ?? 6500);
  const business = Number(formData.get("businessNaira") ?? 12000);
  const first = Number(formData.get("firstNaira") ?? 18500);
  if (![economy, business, first].every((price) => Number.isFinite(price) && price >= 0)) {
    return { error: "Class fares must be zero or more." };
  }

  try {
    await prisma.trip.create({
      data: {
        ...tripData,
        fares: {
          create: [
            { travelClass: "ECONOMY", priceKobo: nairaToKobo(economy), totalSeats: 80, remainingSeats: 80 },
            { travelClass: "BUSINESS", priceKobo: nairaToKobo(business), totalSeats: 24, remainingSeats: 24 },
            { travelClass: "FIRST", priceKobo: nairaToKobo(first), totalSeats: 12, remainingSeats: 12 },
          ],
        },
      },
    });
  } catch {
    return { error: "Could not save trip." };
  }

  revalidatePath("/admin/trips");
  revalidatePath("/");
  redirect("/admin/trips");
}

export async function saveFareAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await guardAdmin();
  const id = String(formData.get("id") ?? "");
  const priceNaira = Number(formData.get("priceNaira"));
  const totalSeats = Number(formData.get("totalSeats"));
  if (!id || !Number.isFinite(priceNaira) || priceNaira < 0 || !Number.isFinite(totalSeats) || totalSeats < 1) {
    return { error: "Enter a valid fare and seat count." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const fare = await tx.fare.findUnique({ where: { id } });
      if (!fare) throw new Error("Fare not found.");

      const sold = fare.totalSeats - fare.remainingSeats;
      if (totalSeats < sold) {
        throw new Error(`At least ${sold} seats are already held or sold.`);
      }

      await tx.fare.update({
        where: { id },
        data: {
          priceKobo: nairaToKobo(priceNaira),
          totalSeats,
          remainingSeats: totalSeats - sold,
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "Fare not found." || error.message.startsWith("At least "))) {
      return { error: error.message };
    }
    return { error: "Could not update fare." };
  }

  revalidatePath("/admin/fares");
  revalidatePath("/admin/trips");
  return { ok: "Fare updated." };
}

export async function cancelBookingAdminAction(bookingId: string) {
  await guardAdmin();
  await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, fareId: true, status: true, _count: { select: { passengers: true } } },
    });
    if (!booking) return;
    if (booking.status === "CANCELLED") return;

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
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
}

export async function updateTripStatusAction(tripId: string, status: TripStatus) {
  await guardAdmin();
  await prisma.trip.update({ where: { id: tripId }, data: { status } });
  revalidatePath("/admin/trips");
  revalidatePath("/admin");
}
