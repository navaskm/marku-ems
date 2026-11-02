"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { AttendanceBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { useCompanyData, useDemo } from "@/features/auth/demo-context";
import { formatDate, formatMinutes, formatTime, todayISO } from "@/lib/dates";
import { fullName } from "@/lib/names";
import { CalendarCheck, Clock3, LogIn, LogOut } from "lucide-react";

export function EmployeeDashboard() {
  const { checkIn, checkOut } = useDemo();
  const { currentEmployee, departments, attendance, employees } =
    useCompanyData();
  if (!currentEmployee) return null;

  const today = todayISO();
  const todayRecord = attendance.find((record) => record.employeeId === currentEmployee.id && record.date === today);
  const department = departments.find((item) => item.id === currentEmployee.departmentId);
  const manager = employees.find((item) => item.id === currentEmployee.managerId);
  const recentAttendance = attendance
    .filter((record) => record.employeeId === currentEmployee.id && record.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);
  const monthRecords = attendance.filter(
    (record) => record.employeeId === currentEmployee.id && record.date.startsWith(today.slice(0, 7)),
  );
  const worked = monthRecords.reduce((sum, record) => sum + record.workingMinutes, 0);
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

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Today"
          value={todayRecord ? todayRecord.status : "Not marked"}
          hint={todayRecord?.checkIn ? `In ${formatTime(todayRecord.checkIn)}` : "Check in to start your day"}
          icon={CalendarCheck}
          tone={todayRecord?.status === "present" ? "green" : todayRecord?.status === "late" ? "amber" : "sky"}
        />
        <StatCard label="Hours this month" value={formatMinutes(worked)} hint="Weekday working time" icon={Clock3} />
        <StatCard
          label="Reports to"
          value={manager ? fullName(manager) : "Unassigned"}
          hint={manager?.jobTitle ?? "No reporting manager"}
          icon={CalendarCheck}
          tone="indigo"
        />
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
