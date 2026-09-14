import Link from "next/link";
import { ArrowRight, Clock3, MapPin, ShieldCheck } from "lucide-react";
import { auth } from "@/auth";
import { firstName, homeForRole } from "@/lib/auth-redirect";
import { SearchForm } from "@/components/search-form";
import { prisma } from "@/lib/db";
import { releaseExpiredHolds } from "@/lib/holds";
import { formatNaira } from "@/lib/money";
import { getStations } from "@/lib/queries";
import { todayWAT } from "@/lib/datetime";

export default async function HomePage() {
  const [stations, session] = await Promise.all([
    getStations(),
    auth(),
    releaseExpiredHolds(prisma),
  ]);
  const loggedIn = Boolean(session?.user?.id);

  return (
    <div>
      <section className="relative overflow-hidden bg-[var(--navy)] text-[var(--cream)]">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-[var(--green)] blur-3xl" />
          <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-[var(--gold)] blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--gold)]">
            Nigerian Railway · WAT timetable
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl leading-tight md:text-6xl">
            Book the Lagos–Ibadan and Abuja–Kaduna trains.
          </h1>
          <p className="mt-4 max-w-xl text-[var(--cream)]/75">
            Search departures, hold seats, and collect a ticket with QR — naira
            fares, WAT times, operator tools included.
          </p>
          {loggedIn ? (
            <p className="mt-4 text-sm">
              <Link
                className="font-semibold text-[var(--gold)] underline"
                href={homeForRole(session?.user?.role)}
              >
                {homeCta(session?.user?.role, session?.user?.name)}
              </Link>
            </p>
          ) : null}
          <div className="mt-8 rounded-2xl bg-[var(--paper)] p-5 text-[var(--navy)] shadow-2xl">
            <SearchForm stations={stations} />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-12 md:grid-cols-3">
        {[
          {
            icon: MapPin,
            title: "Two corridors",
            body: "Mobolaji Johnson, Abeokuta, Ibadan, Idu and Rigasa — seeded for the next two weeks.",
          },
          {
            icon: Clock3,
            title: "WAT timetable",
            body: "Departure boards use Africa/Lagos. Economy, Business, and First Class on every trip.",
          },
          {
            icon: ShieldCheck,
            title: "Seats held at checkout",
            body: "Inventory drops when you start paying. Mock payment now!",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-[var(--line)] bg-white p-5"
          >
            <item.icon className="mb-3 h-5 w-5 text-[var(--green)]" />
            <h2 className="font-display text-xl">{item.title}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{item.body}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--green)]">
              Popular today
            </p>
            <h2 className="font-display text-3xl">Quick searches</h2>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <QuickSearch
            from="LOS"
            to="IBD"
            title="Lagos → Ibadan"
            price={6500}
            date={todayWAT()}
          />
          <QuickSearch
            from="ABV"
            to="KAD"
            title="Abuja → Kaduna"
            price={3000}
            date={todayWAT()}
          />
        </div>
      </section>
    </div>
  );
}

function homeCta(role?: string, name?: string | null) {
  if (role === "ADMIN") return "Open operator dashboard";
  return `Go to your dashboard, ${firstName(name)}`;
}

function QuickSearch({
  from,
  to,
  title,
  price,
  date,
}: {
  from: string;
  to: string;
  title: string;
  price: number;
  date: string;
}) {
  return (
    <Link
      href={`/trips?from=${from}&to=${to}&date=${date}`}
      className="group flex items-center justify-between rounded-xl border border-[var(--line)] bg-white p-5 hover:border-[var(--green)]"
    >
      <div>
        <h3 className="font-display text-2xl">{title}</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          From {formatNaira(price * 100)} · Economy
        </p>
      </div>
      <ArrowRight className="h-5 w-5 text-[var(--green)] transition group-hover:translate-x-1" />
    </Link>
  );
}
