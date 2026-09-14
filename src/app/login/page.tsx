import Link from "next/link";
import { LoginForm } from "@/components/forms";
import { Card, CardBody } from "@/components/ui/card";
import { redirectIfAuthenticated } from "@/lib/session";

export const metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  await redirectIfAuthenticated();
  const { callbackUrl } = await searchParams;
  const next = callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "";

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card>
        <CardBody>
          <h1 className="font-display text-3xl">Welcome back</h1>
          <p className="mb-6 mt-1 text-sm text-[var(--muted)]">
            Passengers land on their travel desk. Operators land on the network console.
          </p>
          <LoginForm callbackUrl={next} />
          <div className="mt-4 space-y-1 text-xs text-[var(--muted)]">
            <p>Passenger: amina@railng.ng / passenger123</p>
            <p>Operator: admin@railng.ng / RailNG!admin</p>
          </div>
          <p className="mt-4 text-center text-sm text-[var(--muted)]">
            New here?{" "}
            <Link className="font-semibold text-[var(--green)]" href="/register">
              Create an account
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
