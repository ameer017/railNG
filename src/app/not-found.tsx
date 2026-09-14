import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--green)]">404</p>
      <h1 className="mt-2 font-display text-4xl">This track does not exist</h1>
      <p className="mt-3 text-[var(--muted)]">The page or ticket reference was not found.</p>
      <Link href="/" className="mt-6 inline-block font-semibold text-[var(--green)]">
        Back to search
      </Link>
    </div>
  );
}
