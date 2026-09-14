import bcrypt from "bcryptjs";
import { PrismaClient, type TravelClass } from "@prisma/client";

const prisma = new PrismaClient();

function lagosDate(offsetDays: number, hour: number, minute: number) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  return new Date(Date.UTC(year, month - 1, day + offsetDays, hour - 1, minute, 0));
}

const CLASS_CONFIG: Record<
  TravelClass,
  { priceNaira: number; seats: number }
> = {
  ECONOMY: { priceNaira: 0, seats: 80 },
  BUSINESS: { priceNaira: 0, seats: 24 },
  FIRST: { priceNaira: 0, seats: 12 },
};

async function main() {
  await prisma.ticket.deleteMany();
  await prisma.passenger.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.fare.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.train.deleteMany();
  await prisma.station.deleteMany();
  await prisma.user.deleteMany();

  const adminHash = await bcrypt.hash("RailNG!admin", 10);
  const passengerHash = await bcrypt.hash("passenger123", 10);

  await prisma.user.create({
    data: {
      email: "admin@railng.ng",
      passwordHash: adminHash,
      name: "RailNG Operator",
      role: "ADMIN",
    },
  });

  await prisma.user.create({
    data: {
      email: "amina@railng.ng",
      passwordHash: passengerHash,
      name: "Amina Bello",
      phone: "+2348012345678",
      role: "PASSENGER",
    },
  });

  const [los, abk, ibd, abv, kad] = await Promise.all([
    prisma.station.create({
      data: { name: "Mobolaji Johnson Station", city: "Lagos", code: "LOS" },
    }),
    prisma.station.create({
      data: { name: "Abeokuta Station", city: "Abeokuta", code: "ABK" },
    }),
    prisma.station.create({
      data: {
        name: "Chief Obafemi Awolowo Station",
        city: "Ibadan",
        code: "IBD",
      },
    }),
    prisma.station.create({
      data: { name: "Idu Station", city: "Abuja", code: "ABV" },
    }),
    prisma.station.create({
      data: { name: "Rigasa Station", city: "Kaduna", code: "KAD" },
    }),
  ]);

  const liex = await prisma.train.create({
    data: { name: "Lagos–Ibadan Express", code: "LIEX" },
  });
  const akex = await prisma.train.create({
    data: { name: "Abuja–Kaduna Express", code: "AKEX" },
  });

  const now = new Date();

  type Service = {
    trainId: string;
    originId: string;
    destinationId: string;
    departHour: number;
    departMinute: number;
    durationMinutes: number;
    fares: Record<TravelClass, number>;
  };

  const services: Service[] = [
    {
      trainId: liex.id,
      originId: los.id,
      destinationId: ibd.id,
      departHour: 8,
      departMinute: 0,
      durationMinutes: 150,
      fares: { ECONOMY: 6500, BUSINESS: 12000, FIRST: 18500 },
    },
    {
      trainId: liex.id,
      originId: los.id,
      destinationId: ibd.id,
      departHour: 14,
      departMinute: 0,
      durationMinutes: 150,
      fares: { ECONOMY: 6500, BUSINESS: 12000, FIRST: 18500 },
    },
    {
      trainId: liex.id,
      originId: los.id,
      destinationId: ibd.id,
      departHour: 18,
      departMinute: 0,
      durationMinutes: 150,
      fares: { ECONOMY: 6500, BUSINESS: 12000, FIRST: 18500 },
    },
    {
      trainId: liex.id,
      originId: ibd.id,
      destinationId: los.id,
      departHour: 7,
      departMinute: 30,
      durationMinutes: 150,
      fares: { ECONOMY: 6500, BUSINESS: 12000, FIRST: 18500 },
    },
    {
      trainId: liex.id,
      originId: ibd.id,
      destinationId: los.id,
      departHour: 13,
      departMinute: 30,
      durationMinutes: 150,
      fares: { ECONOMY: 6500, BUSINESS: 12000, FIRST: 18500 },
    },
    {
      trainId: liex.id,
      originId: ibd.id,
      destinationId: los.id,
      departHour: 17,
      departMinute: 30,
      durationMinutes: 150,
      fares: { ECONOMY: 6500, BUSINESS: 12000, FIRST: 18500 },
    },
    {
      trainId: liex.id,
      originId: los.id,
      destinationId: abk.id,
      departHour: 9,
      departMinute: 15,
      durationMinutes: 75,
      fares: { ECONOMY: 3500, BUSINESS: 7000, FIRST: 11000 },
    },
    {
      trainId: liex.id,
      originId: abk.id,
      destinationId: ibd.id,
      departHour: 11,
      departMinute: 0,
      durationMinutes: 75,
      fares: { ECONOMY: 3500, BUSINESS: 7000, FIRST: 11000 },
    },
    {
      trainId: akex.id,
      originId: abv.id,
      destinationId: kad.id,
      departHour: 8,
      departMinute: 0,
      durationMinutes: 120,
      fares: { ECONOMY: 3000, BUSINESS: 6000, FIRST: 10000 },
    },
    {
      trainId: akex.id,
      originId: abv.id,
      destinationId: kad.id,
      departHour: 16,
      departMinute: 0,
      durationMinutes: 120,
      fares: { ECONOMY: 3000, BUSINESS: 6000, FIRST: 10000 },
    },
    {
      trainId: akex.id,
      originId: kad.id,
      destinationId: abv.id,
      departHour: 8,
      departMinute: 30,
      durationMinutes: 120,
      fares: { ECONOMY: 3000, BUSINESS: 6000, FIRST: 10000 },
    },
    {
      trainId: akex.id,
      originId: kad.id,
      destinationId: abv.id,
      departHour: 16,
      departMinute: 30,
      durationMinutes: 120,
      fares: { ECONOMY: 3000, BUSINESS: 6000, FIRST: 10000 },
    },
  ];

  for (let day = 0; day < 14; day += 1) {
    for (const service of services) {
      const departsAt = lagosDate(day, service.departHour, service.departMinute);
      const arrivesAt = new Date(departsAt.getTime() + service.durationMinutes * 60_000);
      const status = departsAt < now ? "DEPARTED" : "SCHEDULED";

      await prisma.trip.create({
        data: {
          trainId: service.trainId,
          originId: service.originId,
          destinationId: service.destinationId,
          departsAt,
          arrivesAt,
          status,
          fares: {
            create: (["ECONOMY", "BUSINESS", "FIRST"] as TravelClass[]).map((travelClass) => ({
              travelClass,
              priceKobo: service.fares[travelClass] * 100,
              totalSeats: CLASS_CONFIG[travelClass].seats,
              remainingSeats: CLASS_CONFIG[travelClass].seats,
            })),
          },
        },
      });
    }
  }

  console.log("Seeded RailNG Nigeria network: Lagos–Ibadan and Abuja–Kaduna.");
  console.log("Admin: admin@railng.ng / RailNG!admin");
  console.log("Passenger: amina@railng.ng / passenger123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
