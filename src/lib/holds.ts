import type { Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

export const HOLD_MINUTES = 15;

function isPrismaClient(db: Db): db is PrismaClient {
  return "$transaction" in db;
}

export async function releaseExpiredHolds(db: Db, exceptBookingId?: string) {
  if (isPrismaClient(db)) {
    return db.$transaction((tx) => expireHolds(tx, exceptBookingId));
  }
  return expireHolds(db, exceptBookingId);
}

async function expireHolds(tx: Prisma.TransactionClient, exceptBookingId?: string) {
  const expired = await tx.booking.findMany({
    where: {
      status: "PENDING",
      heldUntil: { lt: new Date() },
      ...(exceptBookingId ? { id: { not: exceptBookingId } } : {}),
    },
    select: {
      id: true,
      fareId: true,
      _count: { select: { passengers: true } },
    },
  });

  if (expired.length === 0) return;

  const seatsByFare = new Map<string, number>();
  for (const booking of expired) {
    const cancelled = await tx.booking.updateMany({
      where: { id: booking.id, status: "PENDING" },
      data: { status: "CANCELLED", heldUntil: null },
    });
    if (cancelled.count !== 1) continue;
    seatsByFare.set(booking.fareId, (seatsByFare.get(booking.fareId) ?? 0) + booking._count.passengers);
  }

  if (seatsByFare.size === 0) return;

  await Promise.all(
    [...seatsByFare.entries()].map(([fareId, seats]) =>
      tx.fare.update({
        where: { id: fareId },
        data: { remainingSeats: { increment: seats } },
      }),
    ),
  );
}
