"use client";

import { AttendanceBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { addMonths, formatMonthYear, monthRange, parseISODate, toISODate } from "@/lib/dates";
import type { AttendanceRecord } from "@/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const colors: Record<string, string> = {
  present: "bg-emerald-100 text-emerald-800",
  late: "bg-amber-100 text-amber-800",
  absent: "bg-rose-100 text-rose-800",
  holiday: "bg-slate-100 text-slate-500",
  leave: "bg-sky-100 text-sky-800",
};

export function AttendanceCalendar({
  year,
  monthIndex,
  records,
  onMonthChange,
}: {
  year: number;
  monthIndex: number;
  records: AttendanceRecord[];
  onMonthChange: (year: number, monthIndex: number) => void;
}) {
  const first = new Date(year, monthIndex, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const byDate = new Map(records.map((record) => [record.date, record]));
  const cells = Array.from({ length: startPad + daysInMonth }, (_, index) => {
    if (index < startPad) return null;
    const date = toISODate(new Date(year, monthIndex, index - startPad + 1));
    return { date, record: byDate.get(date) };
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const next = addMonths(year, monthIndex, -1);
            onMonthChange(next.year, next.monthIndex);
          }}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="text-sm font-semibold text-slate-800">{formatMonthYear(year, monthIndex)}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const next = addMonths(year, monthIndex, 1);
            onMonthChange(next.year, next.monthIndex);
          }}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase text-slate-400">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((cell, index) => {
          if (!cell) return <div key={`pad-${index}`} />;
          const day = parseISODate(cell.date).getDate();
          const status = cell.record?.status;
          return (
            <div
              key={cell.date}
              className={cn(
                "flex min-h-16 flex-col rounded-lg border border-slate-100 p-1.5 text-left",
                status ? colors[status] : "bg-white text-slate-400",
              )}
            >
              <span className="text-xs font-semibold">{day}</span>
              {status ? <span className="mt-auto text-[10px] capitalize">{status}</span> : null}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(["present", "late", "absent", "leave", "holiday"] as const).map((status) => (
          <AttendanceBadge key={status} status={status} />
        ))}
      </div>
      <p className="sr-only">{monthRange(year, monthIndex).start}</p>
    </div>
  );
}
