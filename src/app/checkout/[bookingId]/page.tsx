import Link from "next/link";
import { notFound } from "next/navigation";
import { PayForm } from "@/components/forms";
import { HoldCountdown } from "@/components/hold-countdown";
import { prisma } from "@/lib/db";
import { formatTripDateTime } from "@/lib/datetime";
import { formatNaira } from "@/lib/money";
import { classLabel } from "@/lib/seats";
import { requireUser } from "@/lib/session";
import { releaseExpiredHolds } from "@/lib/holds";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const session = await requireUser(`/checkout/${bookingId}`);
  await releaseExpiredHolds(prisma);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      passengers: true,
      trip: { include: { origin: true, destination: true, train: true } },
    },
  });

  if (!booking || booking.userId !== session.user.id) notFound();

  if (booking.status === "PAID") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-3xl">Already paid</h1>
        <p className="mt-2 text-[var(--muted)]">Open your ticket with reference {booking.reference}.</p>
        <Link className="mt-6 inline-block text-[var(--green)] underline" href={`/ticket/${booking.reference}`}>
          View ticket
        </Link>
      </div>
    );
  }

  const expired = booking.status !== "PENDING" || (booking.heldUntil && booking.heldUntil.getTime() < Date.now());

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--green)]">Checkout</p>
        <h1 className="mt-2 font-display text-3xl">Confirm and pay</h1>
        <p className="mt-1 font-mono text-sm text-[var(--muted)]">{booking.reference}</p>
        {booking.heldUntil && !expired ? (
          <div className="mt-3">
            <HoldCountdown heldUntil={booking.heldUntil.toISOString()} />
          </div>
        ) : null}

        <dl className="mt-6 space-y-3 text-sm">
          <Row label="Train" value={booking.trip.train.name} />
          <Row label="Route" value={`${booking.trip.origin.city} → ${booking.trip.destination.city}`} />
          <Row label="Departs" value={formatTripDateTime(booking.trip.departsAt)} />
          <Row label="Class" value={classLabel(booking.travelClass)} />
          <Row label="Passengers" value={booking.passengers.map((p) => p.fullName).join(", ")} />
          <Row label="Amount" value={formatNaira(booking.amountKobo)} />
        </dl>

        <div className="mt-8">
          <CheckoutPay expired={Boolean(expired)} bookingId={booking.id} />
        </div>
      </div>
    </div>
  );
}

function CheckoutPay({ expired, bookingId }: { expired: boolean; bookingId: string }) {
  if (expired) {
    return (
      <div className="rounded-md bg-[#fde8eb] p-4 text-sm text-[#9b2335]">
        This hold has expired and the seats were released.{" "}
        <Link className="underline" href="/">
          Search again
        </Link>
        .
      </div>
    );
  }

  return <PayForm bookingId={bookingId} />;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[var(--line)] pb-2">
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
