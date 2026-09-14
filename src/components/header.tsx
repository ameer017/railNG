import Link from "next/link";
import { auth } from "@/auth";
import { firstName, homeForRole } from "@/lib/auth-redirect";
import { signOutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export async function Header() {
  const session = await auth();
  const home = session ? homeForRole(session.user.role) : "/";

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--paper)]/95 backdrop-blur">
      <div className="rail-stripe h-1.5" />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href={home} aria-label="RailNG home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium">
          <HeaderLinks role={session?.user?.role} signedIn={Boolean(session)} />
          {session ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-[var(--muted)] sm:inline">
                {firstName(session.user.name)}
              </span>
              <form action={signOutAction}>
                <Button variant="outline" size="sm" type="submit">
                  Sign out
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link href="/login">
                <Button variant="outline" size="sm" type="button">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" type="button">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

function HeaderLinks({ role, signedIn }: { role?: string; signedIn: boolean }) {
  if (role === "ADMIN") {
    return (
      <>
        <Link className="hidden rounded-md px-3 py-2 hover:bg-[var(--cream)] sm:inline" href="/admin">
          Dashboard
        </Link>
        <Link className="hidden rounded-md px-3 py-2 hover:bg-[var(--cream)] sm:inline" href="/admin/trips">
          Trips
        </Link>
        <Link className="hidden rounded-md px-3 py-2 hover:bg-[var(--cream)] sm:inline" href="/admin/bookings">
          Bookings
        </Link>
      </>
    );
  }

  if (signedIn) {
    return (
      <>
        <Link className="rounded-md px-3 py-2 hover:bg-[var(--cream)]" href="/dashboard">
          Dashboard
        </Link>
        <Link className="hidden rounded-md px-3 py-2 hover:bg-[var(--cream)] sm:inline" href="/">
          Search
        </Link>
        <Link className="rounded-md px-3 py-2 hover:bg-[var(--cream)]" href="/bookings">
          My tickets
        </Link>
      </>
    );
  }

  return (
    <Link className="hidden rounded-md px-3 py-2 hover:bg-[var(--cream)] sm:inline" href="/">
      Search
    </Link>
  );
}
