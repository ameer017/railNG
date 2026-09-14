import { TrainFront } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-[var(--navy)]", className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--green)] text-white">
        <TrainFront className="h-5 w-5" />
      </span>
      {compact ? null : (
        <span className="leading-tight">
          <span className="block font-display text-lg font-semibold tracking-tight">RailNG</span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Nigeria Rail Tickets
          </span>
        </span>
      )}
    </span>
  );
}
