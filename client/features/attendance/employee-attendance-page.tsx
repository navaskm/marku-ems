"use client";

import { AttendanceCalendar } from "@/features/attendance/attendance-calendar";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { DataTable, type Column } from "@/components/tables/data-table";
import { AttendanceBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { useCompanyData } from "@/features/auth/demo-context";
import { addMonths, formatDate, formatMinutes, formatTime, monthRange } from "@/lib/dates";
import type { AttendanceRecord } from "@/types";
import { CalendarDays, Clock3, Timer } from "lucide-react";
import { useMemo, useState } from "react";

export function EmployeeAttendancePage() {
  const { currentEmployee, attendance } = useCompanyData();
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), monthIndex: now.getMonth() });
  const { start, end } = monthRange(cursor.year, cursor.monthIndex);
  const employeeId = currentEmployee?.id;
  const monthRecords = useMemo(
    () =>
      attendance.filter(
        (record) =>
          employeeId && record.employeeId === employeeId && record.date >= start && record.date <= end,
      ),
    [attendance, employeeId, end, start],
  );
  if (!currentEmployee) return null;

  const present = monthRecords.filter((record) => record.status === "present" || record.status === "late").length;
  const hours = monthRecords.reduce((sum, record) => sum + record.workingMinutes, 0);
  const late = monthRecords.filter((record) => record.status === "late").length;

  const columns: Column<AttendanceRecord>[] = [
    { key: "date", header: "Date", sortable: true, sortValue: (row) => row.date, render: (row) => formatDate(row.date) },
    { key: "status", header: "Status", render: (row) => <AttendanceBadge status={row.status} /> },
    { key: "in", header: "Check in", render: (row) => formatTime(row.checkIn) },
    { key: "out", header: "Check out", render: (row) => formatTime(row.checkOut) },
    { key: "hours", header: "Working hours", sortable: true, sortValue: (row) => row.workingMinutes, render: (row) => formatMinutes(row.workingMinutes) },
  ];

  const monthOptions = [-1, 0, 1].map((delta) => addMonths(now.getFullYear(), now.getMonth(), delta));

  return (
    <div>
      <PageHeader
        title="My attendance"
        description="Calendar and history for your company workspace only."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCursor((value) => addMonths(value.year, value.monthIndex, -1))}>
              Previous
            </Button>
            <Button variant="outline" onClick={() => setCursor((value) => addMonths(value.year, value.monthIndex, 1))}>
              Next
            </Button>
          </div>
        }
      />
      <div className="mb-4 max-w-xs">
        <Select
          value={`${cursor.year}-${cursor.monthIndex}`}
          onChange={(event) => {
            const [year, monthIndex] = event.target.value.split("-").map(Number);
            setCursor({ year, monthIndex });
          }}
        >
          {monthOptions.map((option) => (
            <option key={`${option.year}-${option.monthIndex}`} value={`${option.year}-${option.monthIndex}`}>
              {new Date(option.year, option.monthIndex, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </option>
          ))}
        </Select>
      </div>
      <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard label="Days present" value={present} icon={CalendarDays} tone="green" />
        <StatCard label="Late arrivals" value={late} icon={Timer} tone="amber" />
        <StatCard label="Total hours" value={formatMinutes(hours)} icon={Clock3} />
      </div>
      
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
        <Card>
          <CardBody>
            <AttendanceCalendar year={cursor.year} monthIndex={cursor.monthIndex} records={monthRecords} />
          </CardBody>
        </Card>
        <Card>
          <DataTable columns={columns} rows={[...monthRecords].sort((a, b) => b.date.localeCompare(a.date))} rowKey={(row) => row.id} />
        </Card>
      </div>
    </div>
  );
}
