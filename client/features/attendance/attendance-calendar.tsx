"use client";

import { cn } from "@/lib/cn";
import { formatMonthYear, monthRange, parseISODate } from "@/lib/dates";
import type { AttendanceRecord, AttendanceStatus } from "@/types";

const colors: Record<AttendanceStatus, string> = {
  present: "bg-emerald-500",
  late: "bg-amber-500",
  absent: "bg-rose-500",
  holiday: "bg-slate-300",
  leave: "bg-sky-500",
};

export function AttendanceCalendar({
  year,
  monthIndex,
  records,
}: {
  year: number;
  monthIndex: number;
  records: AttendanceRecord[];
}) {
  const { start } = monthRange(year, monthIndex);
  const first = parseISODate(start);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const byDate = new Map(records.map((record) => [record.date, record]));
  const cells = Array.from({ length: startWeekday + daysInMonth }, (_, index) => {
    if (index < startWeekday) return null;
    const day = index - startWeekday + 1;
    const date = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return { day, date, record: byDate.get(date) };
  });

  return (
    <div>
      <p className="mb-3 text-sm font-medium text-slate-800">{formatMonthYear(year, monthIndex)}</p>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[9px] uppercase text-slate-400 sm:gap-1 sm:text-[11px]">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
          <div key={label} className="py-1">
            <span className="sm:hidden">{label.slice(0, 1)}</span>
            <span className="hidden sm:inline">{label}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {cells.map((cell, index) =>
          cell ? (
            <div key={cell.date} className="rounded-md border border-slate-100 bg-white px-0.5 py-1.5 text-center sm:rounded-lg sm:px-1 sm:py-2">
              <p className="text-[10px] font-medium text-slate-700 sm:text-xs">{cell.day}</p>
              {cell.record ? (
                <span className={cn("mx-auto mt-1 block h-2 w-2 rounded-full", colors[cell.record.status])} />
              ) : (
                <span className="mx-auto mt-1 block h-2 w-2" />
              )}
            </div>
          ) : (
            <div key={`empty-${index}`} />
          ),
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
        {Object.entries(colors).map(([status, color]) => (
          <span key={status} className="inline-flex items-center gap-1.5 capitalize">
            <span className={cn("h-2 w-2 rounded-full", color)} />
            {status}
          </span>
        ))}
      </div>
    </div>
  );
}
