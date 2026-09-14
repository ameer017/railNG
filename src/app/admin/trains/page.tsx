import { deleteTrainAction } from "@/lib/actions/admin";
import { TrainForm } from "@/components/admin-forms";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PagedTable } from "@/components/ui/paged-table";
import { Td, Th } from "@/components/ui/table";
import { prisma } from "@/lib/db";

export const metadata = { title: "Trains" };

export default async function TrainsPage() {
  const trains = await prisma.train.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Trains</h1>
      <Card>
        <CardHeader>
          <h2 className="font-display text-xl">Add service</h2>
        </CardHeader>
        <CardBody>
          <TrainForm />
        </CardBody>
      </Card>
      {trains.length === 0 ? (
        <EmptyState title="No trains" body="Create a named service such as Lagos–Ibadan Express." />
      ) : (
        <Card>
          <CardBody>
            <PagedTable
              header={
                <tr>
                  <Th>Code</Th>
                  <Th>Name</Th>
                  <Th />
                </tr>
              }
              rows={trains.map((train) => (
                <tr key={train.id}>
                  <Td className="font-mono font-semibold">{train.code}</Td>
                  <Td>{train.name}</Td>
                  <Td className="text-right">
                    <form
                      action={async () => {
                        "use server";
                        await deleteTrainAction(train.id);
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
