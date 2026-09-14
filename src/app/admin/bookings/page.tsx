import Link from "next/link";
import { cancelBookingAdminAction } from "@/lib/actions/admin";
import { EmptyState } from "@/components/states";
import { BookingStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { PagedTable } from "@/components/ui/paged-table";
import { Td, Th } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { formatTripDateTime } from "@/lib/datetime";
import { formatNaira } from "@/lib/money";
import { releaseExpiredHolds } from "@/lib/holds";

export const metadata = { title: "Bookings" };

export default async function AdminBookingsPage() {
  await releaseExpiredHolds(prisma);
  const bookings = await prisma.booking.findMany({
    include: {
      user: true,
      passengers: true,
      trip: { include: { origin: true, destination: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Bookings</h1>
      {bookings.length === 0 ? (
        <EmptyState title="No bookings yet" body="When passengers pay, tickets appear here for the operator desk." />
      ) : (
        <Card>
          <CardBody>
            <PagedTable
              header={
                <tr>
                  <Th>Ref</Th>
                  <Th>Passenger</Th>
                  <Th>Trip</Th>
                  <Th>Amount</Th>
                  <Th>Status</Th>
                  <Th />
                </tr>
              }
              rows={bookings.map((booking) => (
                <tr key={booking.id}>
                  <Td className="font-mono text-xs">{booking.reference}</Td>
                  <Td>
                    {booking.user.name}
                    <div className="text-xs text-[var(--muted)]">{booking.passengers.length} pax</div>
                  </Td>
                  <Td>
                    {booking.trip.origin.code}→{booking.trip.destination.code}
                    <div className="text-xs text-[var(--muted)]">{formatTripDateTime(booking.trip.departsAt)}</div>
                  </Td>
                  <Td>{formatNaira(booking.amountKobo)}</Td>
                  <Td>
                    <BookingStatusBadge status={booking.status} />
                  </Td>
                  <Td className="text-right">
                    {booking.status === "PAID" ? (
                      <Link className="mr-2 text-sm font-semibold text-[var(--green)]" href={`/ticket/${booking.reference}`}>
                        Ticket
                      </Link>
                    ) : null}
                    {booking.status !== "CANCELLED" ? (
                      <form
                        className="inline"
                        action={async () => {
                          "use server";
                          await cancelBookingAdminAction(booking.id);
                        }}
                      >
                        <Button size="sm" variant="outline" type="submit">
                          Cancel
                        </Button>
                      </form>
                    ) : null}
                  </Td>
                </tr>
              ))}
            />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
