import { cache } from "react";
import { prisma } from "@/lib/db";

export const getStations = cache(async () => {
  return prisma.station.findMany({ orderBy: { city: "asc" } });
});

export const getPaidBookingByReference = cache(async (reference: string) => {
  return prisma.booking.findFirst({
    where: { reference: reference.toUpperCase(), status: "PAID" },
    include: {
      tickets: { include: { passenger: true } },
      trip: { include: { origin: true, destination: true, train: true } },
    },
  });
});
