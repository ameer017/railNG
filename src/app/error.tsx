"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="font-display text-4xl">Something went off the rails</h1>
      <p className="mt-3 text-[var(--muted)]">{error.message || "Please try again."}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-md bg-[var(--green)] px-4 py-2 text-sm font-semibold text-white"
      >
        Try again
      </button>
    </div>
  );
}
