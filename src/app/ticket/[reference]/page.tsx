import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { PrintButton } from "@/components/print-button";
import { formatTripDateTime } from "@/lib/datetime";
import { getPaidBookingByReference } from "@/lib/queries";
import { classLabel } from "@/lib/seats";

export async function generateMetadata({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const booking = await getPaidBookingByReference(reference);
  if (!booking) return { title: "Ticket" };
  return { title: `Ticket ${booking.reference}` };
}

export default async function TicketPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const booking = await getPaidBookingByReference(reference);

  if (!booking || booking.tickets.length === 0) {
    notFound();
  }

  const tickets = await Promise.all(
    booking.tickets.map(async (ticket) => ({
      ...ticket,
      qr: await QRCode.toDataURL(ticket.qrPayload, { margin: 1, width: 220 }),
    })),
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between no-print">
        <div>
          <h1 className="font-display text-3xl">Your tickets</h1>
          <p className="text-sm text-[var(--muted)]">Show this QR at the gate. Reference {booking.reference}.</p>
        </div>
        <PrintButton />
      </div>
      <div className="space-y-6">
        {tickets.map((ticket) => (
          <article
            key={ticket.id}
            className="print-ticket overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-lg"
          >
            <div className="flex items-center justify-between bg-[var(--navy)] px-5 py-3 text-[var(--cream)]">
              <span className="font-display text-xl">RailNG</span>
              <span className="text-xs uppercase tracking-[0.2em]">{classLabel(booking.travelClass)}</span>
            </div>
            <div className="grid gap-6 p-5 md:grid-cols-[1fr_auto]">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{booking.trip.train.name}</p>
                <h2 className="mt-1 font-display text-3xl">
                  {booking.trip.origin.code} → {booking.trip.destination.code}
                </h2>
                <p className="text-[var(--muted)]">
                  {booking.trip.origin.city} to {booking.trip.destination.city}
                </p>
                <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-[var(--muted)]">Passenger</dt>
                    <dd className="font-semibold">{ticket.passenger.fullName}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted)]">Departs</dt>
                    <dd className="font-semibold">{formatTripDateTime(booking.trip.departsAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted)]">Coach / seat</dt>
                    <dd className="font-semibold">
                      {ticket.coach} / {ticket.seat}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--muted)]">Reference</dt>
                    <dd className="font-mono font-semibold">{booking.reference}</dd>
                  </div>
                </dl>
              </div>
              <div className="flex flex-col items-center justify-center md:border-l md:border-dashed md:border-[var(--line)] md:pl-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ticket.qr} alt={`QR for ${booking.reference}`} className="h-40 w-40" />
                <p className="mt-2 text-[11px] text-[var(--muted)]">Scan at boarding</p>
              </div>
            </div>
            <div className="bg-[var(--cream)] px-5 py-2 text-[11px] text-[var(--muted)]">
              Valid only for the named passenger on this service. WAT timetable. Demo ticket — not an NRC document.
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
