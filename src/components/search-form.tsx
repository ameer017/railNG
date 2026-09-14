"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import type { Station } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { todayWAT } from "@/lib/datetime";

export function SearchForm({
  stations,
  defaults,
  stacked = false,
}: {
  stations: Station[];
  defaults?: { from?: string; to?: string; date?: string };
  stacked?: boolean;
}) {
  const router = useRouter();
  const minDate = useMemo(() => todayWAT(), []);
  const [from, setFrom] = useState(defaults?.from ?? "");
  const [to, setTo] = useState(defaults?.to ?? "");
  const [date, setDate] = useState(defaults?.date ?? minDate);

  function swap() {
    setFrom(to);
    setTo(from);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({ from, to, date });
    router.push(`/trips?${params.toString()}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className={
        stacked
          ? "grid gap-4"
          : "grid gap-4 md:grid-cols-[1fr_auto_1fr_1fr_auto] md:items-end"
      }
    >
      <div>
        <Label htmlFor="from">From</Label>
        <Select id="from" required value={from} onChange={(e) => setFrom(e.target.value)}>
          <option value="">Select station</option>
          {stations.map((station) => (
            <option key={station.id} value={station.code}>
              {station.city} — {station.name}
            </option>
          ))}
        </Select>
      </div>
      <button
        type="button"
        onClick={swap}
        className={
          stacked
            ? "flex h-11 w-full items-center justify-center rounded-md border border-[var(--line)] bg-white text-lg"
            : "mb-1 hidden h-11 w-11 items-center justify-center rounded-md border border-[var(--line)] bg-white text-lg md:flex"
        }
        aria-label="Swap stations"
      >
        ⇄
      </button>
      <div>
        <Label htmlFor="to">To</Label>
        <Select id="to" required value={to} onChange={(e) => setTo(e.target.value)}>
          <option value="">Select station</option>
          {stations.map((station) => (
            <option key={station.id} value={station.code}>
              {station.city} — {station.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="date">Travel date</Label>
        <Input id="date" type="date" required min={minDate} value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <Button type="submit" size="lg" className={stacked ? "w-full" : "md:w-36"}>
        Find trains
      </Button>
    </form>
  );
}
