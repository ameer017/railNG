import Link from "next/link";
import { cancelOwnBookingAction } from "@/lib/actions/booking";
import { EmptyState } from "@/components/states";
import { BookingStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { formatTripDateTime } from "@/lib/datetime";
import { formatNaira } from "@/lib/money";
import { classLabel } from "@/lib/seats";
import { requirePassenger } from "@/lib/session";
import { releaseExpiredHolds } from "@/lib/holds";

export const metadata = { title: "My bookings" };

export default async function BookingsPage() {
  const session = await requirePassenger("/bookings");
  await releaseExpiredHolds(prisma);

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: { trip: { include: { origin: true, destination: true, train: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-3xl">My bookings</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Paid tickets stay here. Pending holds expire after 15 minutes.</p>

      <BookingList bookings={bookings} />
    </div>
  );
}

function BookingList({
  bookings,
}: {
  bookings: {
    id: string;
    reference: string;
    status: "PENDING" | "PAID" | "CANCELLED";
    amountKobo: number;
    travelClass: "ECONOMY" | "BUSINESS" | "FIRST";
    trip: {
      departsAt: Date;
      train: { name: string };
      origin: { city: string };
      destination: { city: string };
    };
  }[];
}) {
  if (bookings.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState title="No journeys yet" body="Search a corridor and book a seat. Your tickets will show up here." />
      </div>
    );
  }

  return (
    <ul className="mt-6 space-y-4">
      {bookings.map((booking) => (
        <li key={booking.id} className="rounded-xl border border-[var(--line)] bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-sm text-[var(--muted)]">{booking.reference}</p>
              <h2 className="font-display text-2xl">
                {booking.trip.origin.city} → {booking.trip.destination.city}
              </h2>
              <p className="text-sm text-[var(--muted)]">
                {booking.trip.train.name} · {formatTripDateTime(booking.trip.departsAt)} ·{" "}
                {classLabel(booking.travelClass)}
              </p>
            </div>
            <BookingStatusBadge status={booking.status} />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">{formatNaira(booking.amountKobo)}</p>
            <div className="flex gap-2">
              {booking.status === "PAID" ? (
                <Link href={`/ticket/${booking.reference}`}>
                  <Button type="button" size="sm">
                    Open ticket
                  </Button>
                </Link>
              ) : null}
              {booking.status === "PENDING" ? (
                <Link href={`/checkout/${booking.id}`}>
                  <Button type="button" size="sm">
                    Complete payment
                  </Button>
                </Link>
              ) : null}
              {booking.status !== "CANCELLED" ? (
                <form
                  action={async () => {
                    "use server";
                    await cancelOwnBookingAction(booking.id);
                  }}
                >
                  <Button type="submit" size="sm" variant="outline">
                    Cancel
                  </Button>
                </form>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
