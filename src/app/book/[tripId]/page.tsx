import { notFound } from "next/navigation";
import { BookingForm } from "@/components/forms";
import { prisma } from "@/lib/db";
import { formatDuration, formatTripDateTime } from "@/lib/datetime";
import { releaseExpiredHolds } from "@/lib/holds";
import { requireUser } from "@/lib/session";

export const metadata = { title: "Book" };

export default async function BookPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  await requireUser(`/book/${tripId}`);
  await releaseExpiredHolds(prisma);

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      train: true,
      origin: true,
      destination: true,
      fares: { orderBy: { priceKobo: "asc" } },
    },
  });

  if (!trip) notFound();
  if (trip.status === "CANCELLED" || trip.status === "DEPARTED" || trip.status === "ARRIVED") notFound();
  if (trip.departsAt.getTime() <= Date.now()) notFound();

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-2xl bg-[var(--navy)] p-6 text-[var(--cream)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">{trip.train.name}</p>
        <h1 className="mt-3 font-display text-4xl">
          {trip.origin.city} → {trip.destination.city}
        </h1>
        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between border-b border-white/10 pb-2">
            <dt className="text-[var(--cream)]/60">Departs</dt>
            <dd>{formatTripDateTime(trip.departsAt)}</dd>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-2">
            <dt className="text-[var(--cream)]/60">Arrives</dt>
            <dd>{formatTripDateTime(trip.arrivesAt)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--cream)]/60">Journey</dt>
            <dd>{formatDuration(trip.departsAt, trip.arrivesAt)}</dd>
          </div>
        </dl>
      </section>
      <section className="rounded-2xl border border-[var(--line)] bg-white p-6">
        <h2 className="font-display text-2xl">Passenger details</h2>
        <p className="mb-5 mt-1 text-sm text-[var(--muted)]">Seats are held for 15 minutes after you continue.</p>
        <BookingForm tripId={trip.id} fares={trip.fares} />
      </section>
    </div>
  );
}
