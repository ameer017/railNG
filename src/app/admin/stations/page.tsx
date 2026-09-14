import { deleteStationAction } from "@/lib/actions/admin";
import { StationForm } from "@/components/admin-forms";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PagedTable } from "@/components/ui/paged-table";
import { Td, Th } from "@/components/ui/table";
import { getStations } from "@/lib/queries";

export const metadata = { title: "Stations" };

export default async function StationsPage() {
  const stations = await getStations();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Stations</h1>
      <Card>
        <CardHeader>
          <h2 className="font-display text-xl">Add station</h2>
        </CardHeader>
        <CardBody>
          <StationForm />
        </CardBody>
      </Card>
      {stations.length === 0 ? (
        <EmptyState title="No stations" body="Add Lagos, Ibadan, Abuja, or Kaduna to start scheduling." />
      ) : (
        <Card>
          <CardBody>
            <PagedTable
              header={
                <tr>
                  <Th>Code</Th>
                  <Th>Station</Th>
                  <Th>City</Th>
                  <Th />
                </tr>
              }
              rows={stations.map((station) => (
                <tr key={station.id}>
                  <Td className="font-mono font-semibold">{station.code}</Td>
                  <Td>{station.name}</Td>
                  <Td>{station.city}</Td>
                  <Td className="text-right">
                    <form
                      action={async () => {
                        "use server";
                        await deleteStationAction(station.id);
                      }}
                    >
                      <Button size="sm" variant="outline" type="submit">
                        Delete
                      </Button>
                    </form>
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
