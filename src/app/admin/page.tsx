import Link from "next/link";
import { firstName } from "@/lib/auth-redirect";
import { prisma } from "@/lib/db";
import { watDayBounds, todayWAT, formatTripTime, greetingWAT } from "@/lib/datetime";
import { formatNaira } from "@/lib/money";
import { releaseExpiredHolds } from "@/lib/holds";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { auth } from "@/auth";

export const metadata = { title: "Operator dashboard" };

export default async function AdminDashboardPage() {
  await releaseExpiredHolds(prisma);
  const session = await auth();
  const { start, end } = watDayBounds(todayWAT());

  const [todayTrips, paidToday, pending, stations, trains] = await Promise.all([
    prisma.trip.findMany({
      where: { departsAt: { gte: start, lte: end } },
      include: {
        origin: true,
        destination: true,
        train: true,
        fares: true,
      },
      orderBy: { departsAt: "asc" },
    }),
    prisma.booking.aggregate({
      where: { status: "PAID", createdAt: { gte: start, lte: end } },
      _sum: { amountKobo: true },
    }),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.station.count(),
    prisma.train.count(),
  ]);

  const revenue = paidToday._sum.amountKobo ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--green)]">Operator desk</p>
        <h1 className="font-display text-3xl">
          {greetingWAT()}, {firstName(session?.user?.name)}
        </h1>
        <p className="text-sm text-[var(--muted)]">Today on the network · WAT · {todayWAT()}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Today's trips" value={String(todayTrips.length)} />
        <Stat label="Paid today" value={formatNaira(revenue)} />
        <Stat label="Open holds" value={String(pending)} />
        <Stat label="Stations / trains" value={`${stations} / ${trains}`} />
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="font-display text-xl">Occupancy</h2>
          <Link className="text-sm font-semibold text-[var(--green)]" href="/admin/trips">
            Manage trips
          </Link>
        </CardHeader>
        <CardBody className="space-y-4">
          {todayTrips.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No trips today.</p>
          ) : (
            todayTrips.map((trip) => {
              const total = trip.fares.reduce((s, f) => s + f.totalSeats, 0);
              const remaining = trip.fares.reduce((s, f) => s + f.remainingSeats, 0);
              const taken = total - remaining;
              const pct = total === 0 ? 0 : Math.round((taken / total) * 100);
              return (
                <div key={trip.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>
                      {formatTripTime(trip.departsAt)} · {trip.origin.code}→{trip.destination.code} · {trip.train.code}
                    </span>
                    <span className="text-[var(--muted)]">
                      {taken}/{total} · {pct}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--cream)]">
                    <div className="h-full bg-[var(--green)]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardBody>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</p>
        <p className="mt-2 font-display text-2xl">{value}</p>
      </CardBody>
    </Card>
  );
}
