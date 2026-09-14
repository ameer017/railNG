export const WAT = "Africa/Lagos";

export function formatWAT(date: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-NG", { timeZone: WAT, ...options }).format(date);
}

export function formatTripTime(date: Date) {
  return formatWAT(date, { hour: "2-digit", minute: "2-digit", hour12: true });
}

export function formatTripDate(date: Date) {
  return formatWAT(date, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTripDateTime(date: Date) {
  return `${formatTripDate(date)} · ${formatTripTime(date)}`;
}

export function formatDuration(start: Date, end: Date) {
  const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

export function todayWAT() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: WAT }).format(new Date());
}

export function greetingWAT(date = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: WAT,
      hour: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .find((part) => part.type === "hour")?.value ?? "12",
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function watDayBounds(dateStr: string) {
  const start = new Date(`${dateStr}T00:00:00+01:00`);
  const end = new Date(`${dateStr}T23:59:59.999+01:00`);
  return { start, end };
}

export function toDateTimeLocalWAT(date: Date) {
  const formatted = new Intl.DateTimeFormat("sv-SE", {
    timeZone: WAT,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return formatted.replace(" ", "T");
}

export function fromDateTimeLocalWAT(value: string) {
  return new Date(`${value}:00+01:00`);
}
