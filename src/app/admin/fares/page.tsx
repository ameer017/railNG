import { FareForm } from "@/components/admin-forms";
import { EmptyState } from "@/components/states";
import { Card, CardBody } from "@/components/ui/card";
import { PagedTable } from "@/components/ui/paged-table";
import { Td, Th } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { formatTripDateTime } from "@/lib/datetime";
import { formatNaira } from "@/lib/money";
import { classLabel } from "@/lib/seats";

export const metadata = { title: "Fares" };

export default async function FaresPage() {
  const fares = await prisma.fare.findMany({
    include: { trip: { include: { origin: true, destination: true, train: true } } },
    orderBy: { trip: { departsAt: "asc" } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Fares</h1>
        <p className="text-sm text-[var(--muted)]">Prices in naira. Remaining seats include pending holds.</p>
      </div>
      {fares.length === 0 ? (
        <EmptyState title="No fares" body="Create a trip and Economy, Business, and First Class fares appear automatically." />
      ) : (
        <Card>
          <CardBody>
            <PagedTable
              header={
                <tr>
                  <Th>Trip</Th>
                  <Th>Class</Th>
                  <Th>Price</Th>
                  <Th>Left / total</Th>
                  <Th>Edit</Th>
                </tr>
              }
              rows={fares.map((fare) => (
                <tr key={fare.id}>
                  <Td>
                    <div className="text-sm">
                      {fare.trip.origin.code}→{fare.trip.destination.code} · {fare.trip.train.code}
                    </div>
                    <div className="text-xs text-[var(--muted)]">{formatTripDateTime(fare.trip.departsAt)}</div>
                  </Td>
                  <Td>{classLabel(fare.travelClass)}</Td>
                  <Td>{formatNaira(fare.priceKobo)}</Td>
                  <Td>
                    {fare.remainingSeats} / {fare.totalSeats}
                  </Td>
                  <Td>
                    <FareForm fare={{ id: fare.id, priceKobo: fare.priceKobo, totalSeats: fare.totalSeats }} />
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
