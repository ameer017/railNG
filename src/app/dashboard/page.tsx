import Link from "next/link";
import { ArrowRight, Ticket, Clock3, Wallet } from "lucide-react";
import { SearchForm } from "@/components/search-form";
import { EmptyState } from "@/components/states";
import { BookingStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { bookingHref, firstName } from "@/lib/auth-redirect";
import { prisma } from "@/lib/db";
import { formatTripDateTime, greetingWAT, todayWAT } from "@/lib/datetime";
import { releaseExpiredHolds } from "@/lib/holds";
import { formatNaira } from "@/lib/money";
import { getStations } from "@/lib/queries";
import { classLabel } from "@/lib/seats";
import { requirePassenger } from "@/lib/session";

export const metadata = { title: "Your dashboard" };

export default async function PassengerDashboardPage() {
  const session = await requirePassenger("/dashboard");
  await releaseExpiredHolds(prisma);
  const now = new Date();

  const [bookings, stations] = await Promise.all([
    prisma.booking.findMany({
      where: { userId: session.user.id },
      include: { trip: { include: { origin: true, destination: true, train: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getStations(),
  ]);

  const upcoming = bookings.filter(
    (booking) => booking.status === "PAID" && booking.trip.departsAt.getTime() >= now.getTime(),
  );
  const pending = bookings.filter((booking) => booking.status === "PENDING");
  const pastPaid = bookings.filter(
    (booking) => booking.status === "PAID" && booking.trip.departsAt.getTime() < now.getTime(),
  );
  const nextTrip = [...upcoming].sort(
    (a, b) => a.trip.departsAt.getTime() - b.trip.departsAt.getTime(),
  )[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="rounded-2xl bg-[var(--navy)] px-6 py-8 text-[var(--cream)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
          Passenger desk · {todayWAT()}
        </p>
        <h1 className="mt-2 font-display text-4xl">
          {greetingWAT()}, {firstName(session.user.name)}
        </h1>
        <p className="mt-2 max-w-xl text-[var(--cream)]/75">
          Your journeys, unpaid holds, and tickets live here — not on the public timetable.
        </p>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat icon={Ticket} label="Upcoming trips" value={String(upcoming.length)} />
        <Stat icon={Wallet} label="Awaiting payment" value={String(pending.length)} />
        <Stat icon={Clock3} label="Completed trips" value={String(pastPaid.length)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          {pending.length > 0 ? (
            <Card>
              <CardHeader>
                <h2 className="font-display text-xl">Finish paying</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                {pending.map((booking) => (
                  <div key={booking.id} className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {booking.trip.origin.city} → {booking.trip.destination.city}
                      </p>
                      <p className="text-sm text-[var(--muted)]">
                        {formatTripDateTime(booking.trip.departsAt)} · {formatNaira(booking.amountKobo)}
                      </p>
                    </div>
                    <Link href={`/checkout/${booking.id}`}>
                      <Button size="sm" type="button">
                        Pay now
                      </Button>
                    </Link>
                  </div>
                ))}
              </CardBody>
            </Card>
          ) : null}

          <NextJourney booking={nextTrip} />

          {bookings.length > 0 ? (
            <Card>
              <CardHeader className="flex items-center justify-between">
                <h2 className="font-display text-xl">Recent bookings</h2>
                <Link className="text-sm font-semibold text-[var(--green)]" href="/bookings">
                  See all
                </Link>
              </CardHeader>
              <CardBody className="space-y-3">
                {bookings.slice(0, 5).map((booking) => (
                  <Link
                    key={booking.id}
                    href={bookingHref(booking)}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[var(--line)] px-3 py-3 hover:border-[var(--green)]"
                  >
                    <div>
                      <p className="font-medium">
                        {booking.trip.origin.city} → {booking.trip.destination.city}
                      </p>
                      <p className="text-xs text-[var(--muted)]">{formatTripDateTime(booking.trip.departsAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookingStatusBadge status={booking.status} />
                      <ArrowRight className="h-4 w-4 text-[var(--muted)]" />
                    </div>
                  </Link>
                ))}
              </CardBody>
            </Card>
          ) : null}
        </div>

        <Card>
          <CardHeader>
            <h2 className="font-display text-xl">Book another trip</h2>
          </CardHeader>
          <CardBody>
            <SearchForm stations={stations} stacked />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Ticket;
}) {
  return (
    <Card>
      <CardBody className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--green-soft)] text-[var(--green-dark)]">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</p>
          <p className="font-display text-2xl">{value}</p>
        </div>
      </CardBody>
    </Card>
  );
}

function NextJourney({
  booking,
}: {
  booking?: {
    reference: string;
    travelClass: "ECONOMY" | "BUSINESS" | "FIRST";
    trip: {
      departsAt: Date;
      train: { name: string };
      origin: { city: string };
      destination: { city: string };
    };
  };
}) {
  if (!booking) {
    return (
      <EmptyState
        title="No upcoming trains"
        body="Search Lagos–Ibadan or Abuja–Kaduna and your next ticket will land on this desk."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-display text-xl">Next journey</h2>
      </CardHeader>
      <CardBody>
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{booking.trip.train.name}</p>
        <h3 className="mt-1 font-display text-3xl">
          {booking.trip.origin.city} → {booking.trip.destination.city}
        </h3>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {formatTripDateTime(booking.trip.departsAt)} · {classLabel(booking.travelClass)} · {booking.reference}
        </p>
        <Link href={`/ticket/${booking.reference}`} className="mt-4 inline-block">
          <Button type="button">Open ticket</Button>
        </Link>
      </CardBody>
    </Card>
  );
}
