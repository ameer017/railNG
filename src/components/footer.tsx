export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--line)] bg-[var(--navy)] text-[var(--cream)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display text-lg">RailNG</p>
        <p className="text-[var(--cream)]/70">
          Demo ticketing for Lagos–Ibadan and Abuja–Kaduna. Payments are mocked.
        </p>
      </div>
    </footer>
  );
}
