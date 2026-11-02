export function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function parseISODate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function formatDate(value: string, options?: Intl.DateTimeFormatOptions): string {
  return parseISODate(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  });
}

export function formatMonthYear(year: number, monthIndex: number): string {
  return new Date(year, monthIndex, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function formatTime(value: string | null): string {
  if (!value) return "—";
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function nowTime(): string {
  const date = new Date();
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh ?? 0) * 60 + (em ?? 0) - ((sh ?? 0) * 60 + (sm ?? 0));
}

export function formatMinutes(total: number): string {
  if (total <= 0) return "0h 00m";
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${hours}h ${pad(minutes)}m`;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function eachDate(start: string, end: string): string[] {
  const dates: string[] = [];
  const cursor = parseISODate(start);
  const last = parseISODate(end);
  while (cursor <= last) {
    dates.push(toISODate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export function workingDaysBetween(start: string, end: string): number {
  return eachDate(start, end).filter((value) => !isWeekend(parseISODate(value))).length;
}

export function addMonths(year: number, monthIndex: number, delta: number): { year: number; monthIndex: number } {
  const date = new Date(year, monthIndex + delta, 1);
  return { year: date.getFullYear(), monthIndex: date.getMonth() };
}

export function monthRange(year: number, monthIndex: number): { start: string; end: string } {
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0);
  return { start: toISODate(start), end: toISODate(end) };
}

export function relativeTime(isoDateTime: string): string {
  const then = new Date(isoDateTime).getTime();
  const now = Date.now();
  const minutes = Math.round((now - then) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
