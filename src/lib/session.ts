import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { homeForRole } from "@/lib/auth-redirect";

export async function requireUser(callbackUrl = "/dashboard") {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  return session;
}

export async function requirePassenger(callbackUrl = "/dashboard") {
  const session = await requireUser(callbackUrl);
  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }
  return session;
}

export async function requireAdmin(callbackUrl = "/admin") {
  const session = await requireUser(callbackUrl);
  if (session.user.role !== "ADMIN") {
    redirect(homeForRole("PASSENGER"));
  }
  return session;
}

export async function redirectIfAuthenticated() {
  const session = await auth();
  if (session?.user?.id) {
    redirect(homeForRole(session.user.role));
  }
}
