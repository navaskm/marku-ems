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
  return day === 0; // Sunday only (1-day weekend policy)
}

export function isSunday(date: Date | string): boolean {
  const d = typeof date === "string" ? parseISODate(date) : date;
  return d.getDay() === 0;
}

export function getSundaysInMonth(year: number, monthIndex: number): string[] {
  const { start, end } = monthRange(year, monthIndex);
  return eachDate(start, end).filter((date) => isSunday(date));
}

export function countSundaysInMonth(year: number, monthIndex: number): number {
  return getSundaysInMonth(year, monthIndex).length;
}

export function formatSalary(value?: number | null): string {
  if (value == null || Number(value) === 0) return "₹0";
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

export interface MonthAttendanceStats {
  monthDays: number;
  attendanceDays: number;
  lopDays: number;
  sundaysCount: number;
  holidaysCount: number;
  workedMinutes: number;
  presentDates: string[];
  lopDates: string[];
}

export function calculateMonthStats(params: {
  employeeId: string;
  companyId: string;
  year: number;
  monthIndex: number;
  attendance: Array<{ employeeId: string; date: string; status: string; workingMinutes: number }>;
  leaveRequests: Array<{ employeeId: string; startDate: string; endDate: string; status: string }>;
  holidays: Array<{ companyId: string; date: string }>;
}): MonthAttendanceStats {
  const { employeeId, companyId, year, monthIndex, attendance, leaveRequests, holidays } = params;
  const { start, end } = monthRange(year, monthIndex);
  const allDates = eachDate(start, end);

  // Sundays in this month
  const sundayDates = new Set(allDates.filter((d) => isSunday(d)));

  // Specified company holidays in this month (exclude Sundays so not double-counted)
  const monthHolidays = holidays.filter(
    (h) => h.companyId === companyId && h.date >= start && h.date <= end && !sundayDates.has(h.date),
  );
  const holidayDates = new Set(monthHolidays.map((h) => h.date));

  // Present / attended dates
  const presentDates = new Set(
    attendance
      .filter(
        (r) =>
          r.employeeId === employeeId &&
          r.date >= start &&
          r.date <= end &&
          (r.status === "present" || r.status === "late"),
      )
      .map((r) => r.date),
  );

  // LOP (Loss of Pay / Leave) days:
  // How many days taken leave on working days (excluding Sundays and specified company holidays)
  const lopDates = new Set<string>();

  // 1. From attendance records marked 'leave' or 'absent'
  attendance
    .filter(
      (r) =>
        r.employeeId === employeeId &&
        r.date >= start &&
        r.date <= end &&
        (r.status === "leave" || r.status === "absent"),
    )
    .forEach((r) => {
      if (!sundayDates.has(r.date) && !holidayDates.has(r.date)) {
        lopDates.add(r.date);
      }
    });

  // 2. From approved leave requests
  leaveRequests
    .filter((lr) => lr.employeeId === employeeId && lr.status === "approved")
    .forEach((lr) => {
      const range = eachDate(lr.startDate, lr.endDate);
      for (const d of range) {
        if (d >= start && d <= end && !sundayDates.has(d) && !holidayDates.has(d)) {
          lopDates.add(d);
        }
      }
    });

  // Tracked hours this month
  const workedMinutes = attendance
    .filter((r) => r.employeeId === employeeId && r.date >= start && r.date <= end)
    .reduce((sum, r) => sum + (r.workingMinutes || 0), 0);

  return {
    monthDays: allDates.length,
    attendanceDays: presentDates.size,
    lopDays: lopDates.size,
    sundaysCount: sundayDates.size,
    holidaysCount: holidayDates.size,
    workedMinutes,
    presentDates: Array.from(presentDates),
    lopDates: Array.from(lopDates),
  };
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
