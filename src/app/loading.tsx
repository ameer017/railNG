export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="h-8 w-48 animate-pulse rounded bg-[var(--line)]" />
      <div className="mt-4 h-24 animate-pulse rounded-xl bg-[var(--line)]" />
    </div>
  );
}
