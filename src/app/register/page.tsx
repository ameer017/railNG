import Link from "next/link";
import { RegisterForm } from "@/components/forms";
import { Card, CardBody } from "@/components/ui/card";
import { redirectIfAuthenticated } from "@/lib/session";

export const metadata = { title: "Register" };

export default async function RegisterPage() {
  await redirectIfAuthenticated();

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card>
        <CardBody>
          <h1 className="font-display text-3xl">Create your RailNG account</h1>
          <p className="mb-6 mt-1 text-sm text-[var(--muted)]">
            After you register you go straight to your passenger dashboard.
          </p>
          <RegisterForm />
          <p className="mt-4 text-center text-sm text-[var(--muted)]">
            Already booked with us?{" "}
            <Link className="font-semibold text-[var(--green)]" href="/login">
              Log in
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
