import type { TravelClass } from "@prisma/client";

const COACH: Record<TravelClass, string> = {
  FIRST: "A",
  BUSINESS: "B",
  ECONOMY: "C",
};

const COLUMNS = ["A", "B", "C", "D"];

export function assignSeats(travelClass: TravelClass, taken: Set<string>, count: number) {
  const coach = COACH[travelClass];
  const assigned: { coach: string; seat: string }[] = [];
  let row = 1;
  let col = 0;

  while (assigned.length < count && row < 80) {
    const seat = `${row}${COLUMNS[col]}`;
    const key = `${coach}-${seat}`;
    if (!taken.has(key)) {
      assigned.push({ coach, seat });
      taken.add(key);
    }
    col += 1;
    if (col >= COLUMNS.length) {
      col = 0;
      row += 1;
    }
  }

  if (assigned.length < count) {
    throw new Error("Not enough seats to assign");
  }

  return assigned;
}

export function classLabel(travelClass: TravelClass) {
  switch (travelClass) {
    case "FIRST":
      return "First Class";
    case "BUSINESS":
      return "Business";
    default:
      return "Economy";
  }
}
