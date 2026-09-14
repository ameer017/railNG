import { requireUser } from "@/lib/session";
import { resolvePostAuthPath } from "@/lib/auth-redirect";
import { redirect } from "next/navigation";

export default async function SignedInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await requireUser("/login");
  const { next } = await searchParams;
  redirect(resolvePostAuthPath(session.user.role, next));
}
