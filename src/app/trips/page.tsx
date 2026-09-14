import Link from "next/link";
import { SearchForm } from "@/components/search-form";
import { EmptyState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { formatDuration, formatTripTime, todayWAT, watDayBounds } from "@/lib/datetime";
import { releaseExpiredHolds } from "@/lib/holds";
import { formatNaira } from "@/lib/money";
import { getStations } from "@/lib/queries";
import { classLabel } from "@/lib/seats";

export const metadata = { title: "Timetable" };

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; date?: string }>;
}) {
  const params = await searchParams;
  const from = params.from?.toUpperCase();
  const to = params.to?.toUpperCase();
  const date = params.date || todayWAT();

  const [stations] = await Promise.all([getStations(), releaseExpiredHolds(prisma)]);
  const origin = stations.find((station) => station.code === from);
  const destination = stations.find((station) => station.code === to);
  const { start, end } = watDayBounds(date);
  const now = new Date();

  const trips =
    origin && destination
      ? await prisma.trip.findMany({
          where: {
            originId: origin.id,
            destinationId: destination.id,
            departsAt: { gte: start > now ? start : now, lte: end },
            status: { in: ["SCHEDULED", "BOARDING"] },
          },
          include: {
            train: true,
            origin: true,
            destination: true,
            fares: { orderBy: { priceKobo: "asc" } },
          },
          orderBy: { departsAt: "asc" },
        })
      : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
        <SearchForm
          stations={stations}
          defaults={{ from: origin?.code, to: destination?.code, date }}
        />
      </div>

      <div className="mt-8">
        <h1 className="font-display text-3xl">
          {origin && destination ? `${origin.city} → ${destination.city}` : "Choose a route"}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Times shown in West Africa Time (WAT).</p>
      </div>

      <div className="mt-8">
        <TripResults origin={Boolean(origin)} destination={Boolean(destination)} trips={trips} />
      </div>
    </div>
  );
}

type TripRow = {
  id: string;
  departsAt: Date;
  arrivesAt: Date;
  train: { code: string; name: string };
  origin: { city: string };
  destination: { city: string };
  fares: { id: string; travelClass: "ECONOMY" | "BUSINESS" | "FIRST"; priceKobo: number; remainingSeats: number }[];
};

function TripResults({
  origin,
  destination,
  trips,
}: {
  origin: boolean;
  destination: boolean;
  trips: TripRow[];
}) {
  if (!origin || !destination) {
    return <EmptyState title="No route selected" body="Pick origin, destination, and a date to see the timetable." />;
  }
  if (trips.length === 0) {
    return (
      <EmptyState
        title="No trains on this date"
        body="Try another day, or swap origin and destination. Seeded services run for the next two weeks."
      />
    );
  }

  return (
    <ul className="space-y-4">
      {trips.map((trip) => {
        const cheapest = trip.fares[0];
        if (!cheapest) return null;
        return (
          <li key={trip.id} className="rounded-xl border border-[var(--line)] bg-white p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 items-center gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">{trip.train.code}</p>
                  <p className="font-display text-3xl tabular-nums">{formatTripTime(trip.departsAt)}</p>
                  <p className="text-sm text-[var(--muted)]">{trip.origin.city}</p>
                </div>
                <div className="min-w-24 flex-1">
                  <p className="text-center text-xs text-[var(--muted)]">
                    {formatDuration(trip.departsAt, trip.arrivesAt)}
                  </p>
                  <div className="mt-1 h-px bg-[var(--navy)]" />
                  <p className="mt-1 text-center text-[11px] uppercase tracking-widest text-[var(--green)]">
                    {trip.train.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-3xl tabular-nums">{formatTripTime(trip.arrivesAt)}</p>
                  <p className="text-sm text-[var(--muted)]">{trip.destination.city}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 lg:max-w-sm">
                {trip.fares.map((fare) => (
                  <Badge key={fare.id} tone={fare.remainingSeats === 0 ? "muted" : "green"}>
                    {classLabel(fare.travelClass)} · {formatNaira(fare.priceKobo)} · {fare.remainingSeats} left
                  </Badge>
                ))}
              </div>
              <div className="flex flex-col items-start gap-2 lg:items-end">
                <p className="text-sm text-[var(--muted)]">
                  From <span className="font-semibold text-[var(--navy)]">{formatNaira(cheapest.priceKobo)}</span>
                </p>
                <Link href={`/book/${trip.id}`}>
                  <Button type="button">Select</Button>
                </Link>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
