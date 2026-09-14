import { TripForm } from "@/components/admin-forms";
import { EmptyState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PagedTable } from "@/components/ui/paged-table";
import { Td, Th } from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { formatTripDateTime } from "@/lib/datetime";
import { getStations } from "@/lib/queries";

export const metadata = { title: "Trips" };

export default async function TripsAdminPage() {
  const [trips, trains, stations] = await Promise.all([
    prisma.trip.findMany({
      include: { train: true, origin: true, destination: true, fares: true },
      orderBy: { departsAt: "asc" },
    }),
    prisma.train.findMany({ orderBy: { name: "asc" } }),
    getStations(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Trips</h1>
      <Card>
        <CardHeader>
          <h2 className="font-display text-xl">Schedule a trip</h2>
        </CardHeader>
        <CardBody>
          <TripForm trains={trains} stations={stations} />
        </CardBody>
      </Card>
      {trips.length === 0 ? (
        <EmptyState title="No trips" body="Create a departure after stations and trains exist." />
      ) : (
        <Card>
          <CardBody>
            <PagedTable
              header={
                <tr>
                  <Th>When</Th>
                  <Th>Route</Th>
                  <Th>Train</Th>
                  <Th>Status</Th>
                  <Th>Seats left</Th>
                </tr>
              }
              rows={trips.map((trip) => (
                <tr key={trip.id}>
                  <Td>{formatTripDateTime(trip.departsAt)}</Td>
                  <Td>
                    {trip.origin.code} → {trip.destination.code}
                  </Td>
                  <Td>{trip.train.code}</Td>
                  <Td>
                    <Badge tone={trip.status === "SCHEDULED" ? "green" : "muted"}>{trip.status}</Badge>
                  </Td>
                  <Td>
                    {trip.fares.reduce((s, f) => s + f.remainingSeats, 0)} /{" "}
                    {trip.fares.reduce((s, f) => s + f.totalSeats, 0)}
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
