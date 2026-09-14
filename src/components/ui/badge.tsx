import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "navy",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "navy" | "green" | "gold" | "muted" | "danger";
}) {
  const tones = {
    navy: "bg-[var(--navy)] text-white",
    green: "bg-[var(--green-soft)] text-[var(--green-dark)]",
    gold: "bg-[#f4e7c3] text-[#7a5b12]",
    muted: "bg-[var(--cream)] text-[var(--muted)]",
    danger: "bg-[#fde8eb] text-[#9b2335]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function BookingStatusBadge({ status }: { status: "PENDING" | "PAID" | "CANCELLED" }) {
  if (status === "PAID") return <Badge tone="green">Paid</Badge>;
  if (status === "PENDING") return <Badge tone="gold">Pending</Badge>;
  return <Badge tone="danger">Cancelled</Badge>;
}
