"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { AttendanceBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { useCompanyData, useDemo } from "@/features/auth/demo-context";
import { addMonths, calculateMonthStats, formatDate, formatMinutes, formatSalary, formatTime, todayISO } from "@/lib/dates";
import { fullName } from "@/lib/names";
import {
  Calendar,
  CalendarCheck,
  CalendarX2,
  Clock3,
  IndianRupee,
  LogIn,
  LogOut,
  PartyPopper,
} from "lucide-react";
import { useState } from "react";

export function EmployeeDashboard() {
  const { checkIn, checkOut } = useDemo();
  const { currentEmployee, departments, attendance, employees, leaveRequests, holidays } =
    useCompanyData();

  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), monthIndex: now.getMonth() });

  if (!currentEmployee) return null;

  const today = todayISO();
  const todayRecord = attendance.find((record) => record.employeeId === currentEmployee.id && record.date === today);
  const department = departments.find((item) => item.id === currentEmployee.departmentId);
  const manager = employees.find((item) => item.id === currentEmployee.managerId);
  const recentAttendance = attendance
    .filter((record) => record.employeeId === currentEmployee.id && record.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  const stats = calculateMonthStats({
    employeeId: currentEmployee.id,
    companyId: currentEmployee.companyId,
    year: cursor.year,
    monthIndex: cursor.monthIndex,
    attendance,
    leaveRequests,
    holidays,
  });

  const monthLabel = new Date(cursor.year, cursor.monthIndex, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const checkedIn = Boolean(todayRecord?.checkIn);
  const checkedOut = Boolean(todayRecord?.checkOut);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${currentEmployee.firstName}`}
        description={`${department?.name ?? "Unassigned"} · ${currentEmployee.jobTitle}`}
        actions={
          <div className="flex flex-col md:flex-row gap-2">
            <Button onClick={checkIn} disabled={checkedIn && !checkedOut}>
              <LogIn className="h-4 w-4" />
              Check in
            </Button>
            <Button variant="outline" onClick={checkOut} disabled={!checkedIn || checkedOut}>
              <LogOut className="h-4 w-4" />
              Check out
            </Button>
          </div>
        }
      />

      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-base font-semibold text-slate-900">
            Monthly overview ({monthLabel})
          </h3>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 whitespace-nowrap px-2 sm:px-3"
              onClick={() => setCursor((c) => addMonths(c.year, c.monthIndex, -1))}
            >
              <span className="hidden sm:inline">Previous month</span>
              <span className="sm:hidden">Prev</span>
            </Button>

            <span className="min-w-0 flex-1 text-center text-xs font-semibold text-slate-700 whitespace-nowrap">
              {monthLabel}
            </span>

            <Button
              size="sm"
              variant="outline"
              className="shrink-0 whitespace-nowrap px-2 sm:px-3"
              onClick={() => setCursor((c) => addMonths(c.year, c.monthIndex, 1))}
            >
              <span className="hidden sm:inline">Next month</span>
              <span className="sm:hidden">Next</span>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Today"
            value={todayRecord ? todayRecord.status : "Not marked"}
            hint={todayRecord?.checkIn ? `In ${formatTime(todayRecord.checkIn)}` : "Check in to start your day"}
            icon={CalendarCheck}
            tone={todayRecord?.status === "present" ? "green" : todayRecord?.status === "late" ? "amber" : "sky"}
          />

          <StatCard
            label="Monthly salary"
            value={formatSalary(currentEmployee.salary)}
            hint="Your monthly compensation"
            icon={IndianRupee}
            tone="green"
          />

          <StatCard
            label="Attendance days"
            value={`${stats.attendanceDays} days`}
            hint="Days present / late this month"
            icon={CalendarCheck}
            tone="green"
          />

          <StatCard
            label="LOP days"
            value={`${stats.lopDays} days`}
            hint="Leave / Loss of Pay (excl. Sundays)"
            icon={CalendarX2}
            tone={stats.lopDays > 0 ? "rose" : undefined}
          />

          <StatCard
            label="Sundays"
            value={`${stats.sundaysCount} days`}
            hint="Weekend off-days this month"
            icon={Calendar}
            tone="sky"
          />

          <StatCard
            label="Company holidays"
            value={`${stats.holidaysCount} days`}
            hint="Official holidays (excl. from LOP)"
            icon={PartyPopper}
            tone="amber"
          />

          <StatCard
            label="Hours this month"
            value={formatMinutes(stats.workedMinutes)}
            hint="Total tracked time"
            icon={Clock3}
          />

          <StatCard
            label="Reports to"
            value={manager ? fullName(manager) : "Unassigned"}
            hint={manager?.jobTitle ?? "No reporting manager"}
            icon={CalendarCheck}
            tone="indigo"
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Recent attendance" description="Your latest working days" />
          <CardBody className="px-0 py-0">
            <div className="hidden overflow-x-auto sm:block">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3 text-left">Date</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Check in</th>
                    <th className="px-5 py-3 text-left">Check out</th>
                    <th className="px-5 py-3 text-left">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAttendance.map((record) => (
                    <tr key={record.id} className="border-t border-slate-100">
                      <td className="px-5 py-3">{formatDate(record.date)}</td>
                      <td className="px-5 py-3">
                        <AttendanceBadge status={record.status} />
                      </td>
                      <td className="px-5 py-3">{formatTime(record.checkIn)}</td>
                      <td className="px-5 py-3">{formatTime(record.checkOut)}</td>
                      <td className="px-5 py-3">{formatMinutes(record.workingMinutes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-slate-100 sm:hidden">
              {recentAttendance.map((record) => (
                <div key={record.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">{formatDate(record.date)}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatTime(record.checkIn)} – {formatTime(record.checkOut)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <AttendanceBadge status={record.status} />
                    <p className="mt-1 text-xs text-slate-500">{formatMinutes(record.workingMinutes)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

      </div>
    </div>
  );
}
