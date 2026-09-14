import { AlertCircle, Inbox } from "lucide-react";

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--line)] bg-white px-6 py-16 text-center">
      <Inbox className="mb-3 h-10 w-10 text-[var(--muted)]" />
      <h2 className="font-display text-xl">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-[var(--muted)]">{body}</p>
    </div>
  );
}

export function ErrorBox({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="mb-4 flex items-start gap-2 rounded-md border border-[#f3c1c8] bg-[#fde8eb] px-3 py-2 text-sm text-[#9b2335]">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}
