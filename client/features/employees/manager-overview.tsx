"use client";

import { BarChart, StackedDayChart } from "@/components/dashboard/charts";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { LeaveBadge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { leaveLabel, useCompanyData } from "@/features/auth/demo-context";
import { formatDate, relativeTime, todayISO } from "@/lib/dates";
import { fullName } from "@/lib/names";
import { CalendarOff, Clock, UserMinus, Users } from "lucide-react";
import Link from "next/link";

export function ManagerOverview() {
  const { employees, departments, attendance, leaveRequests, activities } = useCompanyData();
  const today = todayISO();
  const active = employees.filter((employee) => employee.status === "active" && !employee.email.startsWith("owner@"));
  const todayRecords = attendance.filter((record) => record.date === today && active.some((employee) => employee.id === record.employeeId));
  const present = todayRecords.filter((record) => record.status === "present" || record.status === "late").length;
  const absent = todayRecords.filter((record) => record.status === "absent").length;
  const onLeave = todayRecords.filter((record) => record.status === "leave").length;
  const late = todayRecords.filter((record) => record.status === "late").length;
  const percentage = active.length ? Math.round((present / active.length) * 100) : 0;

  const departmentBars = departments.map((department) => ({
    label: department.name,
    value: employees.filter((employee) => employee.departmentId === department.id && employee.status === "active").length,
  }));

  const days = Array.from({ length: 10 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (9 - index));
    const iso = date.toISOString().slice(0, 10);
    const records = attendance.filter((record) => record.date === iso);
    return {
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      present: records.filter((record) => record.status === "present").length,
      late: records.filter((record) => record.status === "late").length,
      absent: records.filter((record) => record.status === "absent").length,
    };
  });

  const pending = leaveRequests.filter((request) => request.status === "pending").slice(0, 5);

  return (
    <div>
      <PageHeader title="Manager overview" description="Live snapshot of your company workspace." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Employees" value={active.length} icon={Users} />
        <StatCard label="Present today" value={present} hint={`${percentage}% attendance`} icon={Clock} tone="green" />
        <StatCard label="Absent / leave" value={`${absent} / ${onLeave}`} icon={UserMinus} tone="rose" />
        <StatCard label="Late arrivals" value={late} icon={CalendarOff} tone="amber" />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Attendance overview" description="Last 10 days · present, late, absent" />
          <CardBody>
            <StackedDayChart days={days} />
            <div className="mt-3 flex gap-4 text-xs text-slate-500">
              <span>Indigo present</span>
              <span>Amber late</span>
              <span>Rose absent</span>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Employees by department" />
          <CardBody>
            <BarChart items={departmentBars} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader
            title="Pending leave"
            action={
              <Link href="/manager/leaves" className="text-xs font-medium text-indigo-600">
                Review
              </Link>
            }
          />
          <CardBody className="space-y-3">
            {pending.map((request) => {
              const employee = employees.find((item) => item.id === request.employeeId);
              return (
                <div key={request.id} className="rounded-lg border border-slate-100 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-800">{employee ? fullName(employee) : "Employee"}</p>
                    <LeaveBadge status={request.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {leaveLabel(request.type)} · {formatDate(request.startDate)} – {formatDate(request.endDate)}
                  </p>
                </div>
              );
            })}
          </CardBody>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title="Recent activity" />
          <CardBody className="space-y-3">
            {activities.slice(0, 8).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0">
                <p className="text-sm text-slate-700">{item.message}</p>
                <p className="shrink-0 text-xs text-slate-400">{relativeTime(item.createdAt)}</p>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
