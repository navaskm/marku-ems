"use client";

import { BarChart, StackedDayChart, TrendChart } from "@/components/dashboard/charts";
import { PageHeader } from "@/components/dashboard/page-header";
import Image from "next/image";
import { StatCard } from "@/components/dashboard/stat-card";
import { DataTable, type Column } from "@/components/tables/data-table";
import { AttendanceBadge, LeaveBadge, StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { useCompanyData, useDemo, leaveLabel } from "@/features/auth/demo-context";
import { AccountSettingsForm } from "@/features/auth/account-settings-form";
import { PasswordChangeForm } from "@/features/auth/password-change-form";
import { addMonths, calculateMonthStats, formatDate, formatMinutes, formatSalary, formatTime, relativeTime, todayISO } from "@/lib/dates";
import { fullName } from "@/lib/names";
import type { Announcement, AttendanceRecord, Department, Employee, Holiday, LeaveRequest } from "@/types";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  ArrowLeft,
  Building2,
  Calendar,
  CalendarCheck,
  CalendarX2,
  Copy,
  Eye,
  EyeOff,
  Check,
  ClipboardList,
  Clock3,
  FileText,
  IndianRupee,
  Megaphone,
  PartyPopper,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";

function companyEmployees(employees: Employee[]) {
  return employees.filter((employee) => !employee.email.startsWith("owner@"));
}

function employeeFromSlug(employees: Employee[], slug: string) {
  const normalized = decodeURIComponent(slug).toLowerCase();
  return employees.find((employee) => fullName(employee).toLowerCase().replace(/\s+/g, "-") === normalized);
}

export function ManagerEmployeeDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { updateEmployeeSalary } = useDemo();
  const { employees, departments, attendance, leaveRequests, holidays } = useCompanyData();
  const employee = employeeFromSlug(employees, slug);

  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), monthIndex: now.getMonth() });
  const [editingSalary, setEditingSalary] = useState(false);
  const [salaryInput, setSalaryInput] = useState(String(employee?.salary ?? 0));
  const [salarySaving, setSalarySaving] = useState(false);
  const [salaryError, setSalaryError] = useState<string | null>(null);

  if (!employee) {
    return <EmptyManagerPage title="Employee not found" description="This employee may have been removed from the directory." />;
  }

  const department = departments.find((item) => item.id === employee.departmentId);
  const records = attendance.filter((record) => record.employeeId === employee.id).sort((a, b) => b.date.localeCompare(a.date));

  const stats = calculateMonthStats({
    employeeId: employee.id,
    companyId: employee.companyId,
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

  async function handleSaveSalary(e: React.FormEvent) {
    e.preventDefault();
    if (!employee) return;
    setSalaryError(null);
    const num = Number(salaryInput.replace(/,/g, "").trim());
    if (isNaN(num) || num < 0) {
      setSalaryError("Please enter a valid salary amount.");
      return;
    }
    setSalarySaving(true);
    const err = await updateEmployeeSalary(employee.id, num);
    setSalarySaving(false);
    if (err) {
      setSalaryError(err);
    } else {
      setEditingSalary(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={fullName(employee)}
        description={employee.jobTitle}
        actions={
          <Link href="/manager/employees" className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600">
            <ArrowLeft className="h-4 w-4" />
            Back to employees
          </Link>
        }
      />

      <div className="min-w-0 space-y-6">
        <Card>
          <CardBody className="flex flex-col items-center text-center">
            <div className="flex w-full flex-row items-center gap-4">
              <Avatar employee={employee} size="xl" />

              <div className="min-w-0 flex flex-col items-start gap-1">
                <h2 className="text-lg font-semibold text-slate-900">
                  {fullName(employee)}
                </h2>

                <p className="text-sm text-slate-500">
                  {employee.jobTitle}
                </p>

                <div className="mt-1">
                  <StatusBadge status={employee.status} />
                </div>
              </div>
            </div>

            <div className="mt-6 grid w-full gap-4 border-t border-slate-100 pt-5 text-left text-sm grid-cols-2">
              <Detail label="Email" value={employee.email} />

              <Detail label="Phone" value={employee.phone} />

              <Detail label="Department" value={department?.name ?? "Unassigned"} />

              <Detail label="Joined" value={formatDate(employee.joiningDate)} />

              <div className="flex items-center justify-between gap-2 sm:block">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Monthly Salary</p>
                  <p className="text-right text-sm font-semibold text-emerald-700 sm:mt-1 sm:text-left">
                    {formatSalary(employee.salary)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-1 h-7 text-xs"
                  onClick={() => {
                    setSalaryInput(String(employee.salary || 0));
                    setSalaryError(null);
                    setEditingSalary(true);
                  }}
                >
                  <Pencil className="mr-1 h-3 w-3" />
                  Update salary
                </Button>
              </div>

              <div className="min-w-0">
                <PasswordDetail
                  password={
                    employee.password ||
                    (employee.firstName +
                      employee.lastName.replace(/[^a-zA-Z0-9]/g, "")).toLowerCase()
                  }
                />
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Attendance & leave summary
              </h3>
              <p className="text-xs text-slate-500">
                Performance and attendance statistics for {monthLabel}
              </p>
            </div>
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

          <div className="grid min-w-0 gap-4 grid-cols-2 xl:grid-cols-3">
            <StatCard
              label="Monthly salary"
              value={formatSalary(employee.salary)}
              hint="Click to edit salary"
              icon={IndianRupee}
              tone="green"
              onClick={() => {
                setSalaryInput(String(employee.salary || 0));
                setSalaryError(null);
                setEditingSalary(true);
              }}
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
              hint="Total working hours logged"
              icon={Clock3}
            />
          </div>

          <Card>
            <CardHeader title="Recent attendance" />
            <CardBody className="px-0 py-0">
              <AttendanceTable records={records.slice(0, 10)} />
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        open={editingSalary}
        onClose={() => setEditingSalary(false)}
        title={`Update salary for ${fullName(employee)}`}
      >
        <form onSubmit={handleSaveSalary} className="space-y-4">
          <Field label="Monthly salary (INR ₹)">
            <div className="relative flex items-center">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-semibold text-slate-500">
                ₹
              </span>
              <Input
                type="number"
                min="0"
                step="500"
                required
                value={salaryInput}
                onChange={(e) => setSalaryInput(e.target.value)}
                placeholder="e.g. 45000"
                className="pl-8"
              />
            </div>
          </Field>
          {salaryError && <p className="text-sm text-rose-600">{salaryError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setEditingSalary(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={salarySaving}>
              {salarySaving ? "Saving..." : "Save salary"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export function ManagerAttendancePage() {
  const { employees, attendance, departments } = useCompanyData();
  const staff = companyEmployees(employees);
  const today = todayISO();
  const records = staff.map((employee) => attendance.find((record) => record.employeeId === employee.id && record.date === today) ?? { id: `missing-${employee.id}`, companyId: employee.companyId, employeeId: employee.id, date: today, status: "absent" as const, checkIn: null, checkOut: null, workingMinutes: 0 });
  const [departmentId, setDepartmentId] = useState("all");
  const filtered = records.filter((record) => departmentId === "all" || departments.find((department) => department.id === employeeFor(record, staff)?.departmentId)?.id === departmentId);
  const present = filtered.filter((record) => record.status === "present" || record.status === "late").length;
  return <div><PageHeader title="Attendance" description={`Team attendance for ${formatDate(today)}.`} actions={<Select className="w-48" value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}><option value="all">All departments</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</Select>} />
    <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-4"><StatCard label="Present" value={present} hint={`${filtered.length ? Math.round((present / filtered.length) * 100) : 0}% of team`} icon={Check} tone="green" /><StatCard label="Late" value={filtered.filter((record) => record.status === "late").length} icon={Clock3} tone="amber" /><StatCard label="Absent or leave" value={filtered.filter((record) => record.status === "absent" || record.status === "leave").length} icon={X} tone="rose" />
    </div>
    <Card><CardHeader title="Today’s attendance" /><CardBody className="px-0 py-0"><AttendanceTeamTable records={filtered} employees={staff} departments={departments} /></CardBody></Card></div>;
}

function employeeFor(record: AttendanceRecord, employees: Employee[]) { return employees.find((employee) => employee.id === record.employeeId); }

export function ManagerLeavesPage() {
  const { employees, leaveRequests } = useCompanyData();
  const { approveLeave, rejectLeave } = useDemo();
  const [filter, setFilter] = useState("pending");
  const [rejecting, setRejecting] = useState<LeaveRequest | null>(null);
  const [reason, setReason] = useState("Please choose different dates so we can maintain team coverage.");
  const visible = leaveRequests.filter((request) => filter === "all" || request.status === filter).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return <div><PageHeader title="Leave requests" description="Review and manage time-off requests from your team." actions={<Select className="w-40" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="pending">Pending</option><option value="all">All requests</option><option value="approved">Approved</option><option value="rejected">Rejected</option></Select>} /><Card><DataTable columns={leaveColumns(employees, approveLeave, setRejecting)} rows={visible} rowKey={(row) => row.id} emptyTitle="No leave requests" emptyDescription="There are no requests in this view." /></Card><Modal open={Boolean(rejecting)} title="Reject leave request" description="Add a short reason for the employee." onClose={() => setRejecting(null)}><div className="space-y-4"><Field label="Reason"><Textarea value={reason} onChange={(event) => setReason(event.target.value)} /></Field><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setRejecting(null)}>Cancel</Button><Button variant="danger" onClick={() => { if (rejecting) rejectLeave(rejecting.id, reason); setRejecting(null); }}>Reject request</Button></div></div></Modal></div>;
}

function leaveColumns(employees: Employee[], approveLeave: (id: string) => void, setRejecting: (request: LeaveRequest) => void): Column<LeaveRequest>[] {
  return [{ key: "employee", header: "Employee", sortable: true, sortValue: (row) => { const employee = employees.find((item) => item.id === row.employeeId); return employee ? fullName(employee) : ""; }, render: (row) => { const employee = employees.find((item) => item.id === row.employeeId); return <div><p className="font-medium text-slate-900">{employee ? fullName(employee) : "Employee"}</p><p className="text-xs text-slate-500">{employee?.employeeCode}</p></div>; } }, { key: "type", header: "Leave", render: (row) => <span>{leaveLabel(row.type)} · {row.days} {row.days === 1 ? "day" : "days"}</span> }, { key: "dates", header: "Dates", sortable: true, sortValue: (row) => row.startDate, render: (row) => <span>{formatDate(row.startDate)} – {formatDate(row.endDate)}</span> }, { key: "status", header: "Status", render: (row) => <LeaveBadge status={row.status} /> }, { key: "actions", header: "", render: (row) => row.status === "pending" ? <div className="flex justify-end gap-2"><Button size="sm" onClick={() => approveLeave(row.id)}>Approve</Button><Button size="sm" variant="outline" onClick={() => setRejecting(row)}>Reject</Button></div> : <span className="text-xs text-slate-400">Reviewed</span> }];
}

export function ManagerDepartmentsPage() {
  const { employees, departments } = useCompanyData();
  const { addDepartment, updateDepartment, deleteDepartment } = useDemo();
  const [editing, setEditing] = useState<Department | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Department | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const openCreate = () => { setForm({ name: "", description: "" }); setCreating(true); };
  const openEdit = (department: Department) => { setForm({ name: department.name, description: department.description }); setEditing(department); };
  const save = () => { const result = editing ? updateDepartment(editing.id, form) : addDepartment(form); if (!result) { setEditing(null); setCreating(false); } };
  return <div><PageHeader title="Departments" description="Organize your workforce and review team sizes." actions={<Button onClick={openCreate}><Plus className="h-4 w-4" />Add department</Button>} /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{departments.map((department) => <Card key={department.id}><CardBody><div className="flex items-start justify-between"><div className="flex h-5 w-5 md:h-7 md:w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Building2 className="h-5 w-5" /></div><div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => openEdit(department)}><Pencil className="h-4 w-4" /></Button><Button size="sm" variant="ghost" onClick={() => setDeleting(department)}><Trash2 className="h-4 w-4 text-rose-500" /></Button></div></div><h2 className="mt-4 font-semibold text-slate-900">{department.name}</h2><p className="mt-1 min-h-6 md:min-h-10 text-sm text-slate-500">{department.description || "No description added."}</p><p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">{employees.filter((employee) => employee.departmentId === department.id && employee.status === "active").length} active employees</p></CardBody></Card>)}</div><DepartmentModal open={creating || Boolean(editing)} title={editing ? "Edit department" : "Add department"} form={form} setForm={setForm} onClose={() => { setCreating(false); setEditing(null); }} onSave={save} /><ConfirmDialog open={Boolean(deleting)} title="Delete department?" message={`This removes ${deleting?.name ?? "the department"} if no employees are assigned to it.`} confirmLabel="Delete" danger onClose={() => setDeleting(null)} onConfirm={() => { if (deleting) deleteDepartment(deleting.id); }} /></div>;
}

function DepartmentModal({ open, title, form, setForm, onClose, onSave }: { open: boolean; title: string; form: { name: string; description: string }; setForm: (form: { name: string; description: string }) => void; onClose: () => void; onSave: () => void }) { return <Modal open={open} title={title} onClose={onClose}><div className="space-y-4"><Field label="Name"><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field><Field label="Description"><Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field><div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={onSave}>Save department</Button></div></div></Modal>; }

export function ManagerAnnouncementsPage() {
  const { announcements, currentEmployee } = useCompanyData();
  const { addAnnouncement, updateAnnouncement, deleteAnnouncement } = useDemo();
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ title: "", body: "" });
  const save = () => { const result = editing ? updateAnnouncement(editing.id, form) : addAnnouncement(form); if (!result) { setEditing(null); setCreating(false); } };
  const startEdit = (item: Announcement) => { setForm({ title: item.title, body: item.body }); setEditing(item); };
  return <div><PageHeader title="Announcements" description="Share updates with everyone in your company." actions={<Button onClick={() => { setForm({ title: "", body: "" }); setCreating(true); }}><Plus className="h-4 w-4" />New announcement</Button>} /><div className="space-y-4">{announcements.map((item) => <Card key={item.id}><CardBody><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><Megaphone className="h-4 w-4 text-indigo-600" /><h2 className="font-semibold text-slate-900">{item.title}</h2></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.body}</p><p className="mt-3 text-xs text-slate-400">Published {relativeTime(item.publishedAt)}{item.authorId === currentEmployee?.id ? " · You" : ""}</p></div><div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => startEdit(item)}><Pencil className="h-4 w-4" /></Button><Button size="sm" variant="ghost" onClick={() => setDeleting(item)}><Trash2 className="h-4 w-4 text-rose-500" /></Button></div></div></CardBody></Card>)}</div><Modal open={creating || Boolean(editing)} title={editing ? "Edit announcement" : "New announcement"} onClose={() => { setCreating(false); setEditing(null); }}><div className="space-y-4"><Field label="Title"><Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field><Field label="Message"><Textarea className="min-h-40" value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} /></Field><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => { setCreating(false); setEditing(null); }}>Cancel</Button><Button onClick={save}>Publish announcement</Button></div></div></Modal><ConfirmDialog open={Boolean(deleting)} title="Delete announcement?" message="This removes the announcement from the company feed." confirmLabel="Delete" danger onClose={() => setDeleting(null)} onConfirm={() => { if (deleting) deleteAnnouncement(deleting.id); }} /></div>;
}

export function ManagerReportsPage() {
  const { employees, attendance, departments, leaveRequests } = useCompanyData();
  const staff = companyEmployees(employees);
  const days = Array.from({ length: 10 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - (9 - index)); const iso = date.toISOString().slice(0, 10); const records = attendance.filter((record) => record.date === iso && staff.some((employee) => employee.id === record.employeeId)); return { label: date.toLocaleDateString("en-US", { weekday: "short" }), present: records.filter((record) => record.status === "present").length, late: records.filter((record) => record.status === "late").length, absent: records.filter((record) => record.status === "absent").length }; });
  const totalMinutes = attendance.filter((record) => staff.some((employee) => employee.id === record.employeeId)).reduce((sum, record) => sum + record.workingMinutes, 0);
  const departmentBars = departments.map((department) => ({ label: department.name, value: staff.filter((employee) => employee.departmentId === department.id && employee.status === "active").length }));
  return <div><PageHeader title="Reports" description="A high-level view of workforce activity and trends." /><div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Team size" value={staff.length} icon={Users} /><StatCard label="Active employees" value={staff.filter((employee) => employee.status === "active").length} icon={Activity} tone="green" /><StatCard label="Pending leaves" value={leaveRequests.filter((request) => request.status === "pending").length} icon={ClipboardList} tone="amber" /><StatCard label="Tracked hours" value={formatMinutes(totalMinutes)} icon={Clock3} /></div><div className="grid gap-6 xl:grid-cols-2"><Card><CardHeader title="Attendance trend" description="Last 10 days" /><CardBody><StackedDayChart days={days} /></CardBody></Card><Card><CardHeader title="Team distribution" /><CardBody><BarChart items={departmentBars} /></CardBody></Card><Card className="xl:col-span-2"><CardHeader title="Daily attendance total" /><CardBody><TrendChart points={days.map((day) => ({ label: day.label, value: day.present + day.late }))} /></CardBody></Card></div></div>;
}

export function ManagerSettingsPage() {
  const { addHoliday, deleteHoliday } = useDemo();
  const { company, employees, holidays } = useCompanyData();

  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [holidayName, setHolidayName] = useState("");
  const [holidayDate, setHolidayDate] = useState("");
  const [holidaySaving, setHolidaySaving] = useState(false);
  const [holidayError, setHolidayError] = useState<string | null>(null);
  const [deletingHoliday, setDeletingHoliday] = useState<Holiday | null>(null);

  if (!company) return null;
  const totalEmployees = employees.filter(
    (employee) => employee.status === "active" && !employee.email.startsWith("owner@"),
  ).length;

  async function handleCreateHoliday(e: React.FormEvent) {
    e.preventDefault();
    setHolidayError(null);
    if (!holidayName.trim()) {
      setHolidayError("Holiday name is required.");
      return;
    }
    if (!holidayDate) {
      setHolidayError("Holiday date is required.");
      return;
    }
    setHolidaySaving(true);
    const err = await addHoliday({ name: holidayName.trim(), date: holidayDate });
    setHolidaySaving(false);
    if (err) {
      setHolidayError(err);
    } else {
      setHolidayName("");
      setHolidayDate("");
      setHolidayModalOpen(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Organization profile, company holidays, and your personal credentials."
      />

      {/* <div className="grid gap-6 xl:grid-cols-2"> */}
      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader
            title="Company profile"
            description="Organization profile and company details"
          />

          <CardBody className="flex-1">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white">
                <Image
                  src="/MarkU-Logo.png"
                  alt="MarkU logo"
                  fill
                  className="object-contain p-2"
                  sizes="64px"
                />
              </div>

              <div>
                <p className="text-lg font-semibold text-slate-900">{company.name}</p>
                <p className="text-sm text-slate-500">
                  Organization profile and company details
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5 pt-6">
              <Detail label="Company name" value={company.name} />
              <Detail label="Total employees" value={String(totalEmployees)} />
              <Detail label="Weekend policy" value="Sunday only (1 day off)" />
              <Detail label="Company holidays" value={`${holidays.length} specified`} />
            </div>
          </CardBody>
        </Card>

        <Card className="flex flex-col">
          <CardHeader
            title="Account credentials"
            description="Manage your email, phone number, and password."
          />

          <CardBody className="flex-1 space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Sign-in details (Email & Phone)</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Update your email address or phone number. These will be required on your next login.
                </p>
              </div>
              <AccountSettingsForm />
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Password</h3>
                <p className="mt-1 text-sm text-slate-500">Change your password for this account.</p>
              </div>
              <PasswordChangeForm />
            </div>
          </CardBody>
        </Card>

        <Card className="flex min-w-0 flex-col xl:col-span-2">
          <CardHeader
            title="Company holidays"
            description="Specify official company holidays (e.g. Christmas). Employees are exempt from work on these days, and they are not counted in Loss of Pay (LOP) leave days."
            action={
              <Button
                size="sm"
                className="shrink-0 whitespace-nowrap px-2 sm:px-3"
                onClick={() => setHolidayModalOpen(true)}
              >
                <Plus className="mr-1 h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Add holiday</span>
                <span className="sm:hidden">Add</span>
              </Button>
            }
          />

          <CardBody className="flex-1">
            {holidays.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                No company holidays configured yet. Click "Add holiday" to specify one.
              </div>
            ) : (
              <div className="w-full min-w-0">
                <div className="w-full overflow-x-auto">
                  <table className="w-max min-w-full text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="whitespace-nowrap px-4 py-3 text-left">Holiday Name</th>
                        <th className="whitespace-nowrap px-4 py-3 text-left">Date</th>
                        <th className="whitespace-nowrap px-4 py-3 text-left">Day</th>
                        <th className="whitespace-nowrap px-4 py-3 text-left">Impact</th>
                        <th className="whitespace-nowrap px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {holidays
                        .slice()
                        .sort((a, b) => a.date.localeCompare(b.date))
                        .map((holiday) => {
                          const dateObj = new Date(`${holiday.date}T00:00:00`);
                          const dayName = dateObj.toLocaleDateString("en-US", {
                            weekday: "long",
                          });

                          return (
                            <tr key={holiday.id} className="hover:bg-slate-50/50">
                              <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                                {holiday.name}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                                {formatDate(holiday.date)}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                                {dayName}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-emerald-700">
                                Full day off · Exempt from LOP
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-right">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                  onClick={() => setDeletingHoliday(holiday)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardBody>

        </Card>
      </div>

      <Modal
        open={holidayModalOpen}
        onClose={() => setHolidayModalOpen(false)}
        title="Add company holiday"
      >
        <form onSubmit={handleCreateHoliday} className="space-y-4">
          <Field label="Holiday name">
            <Input
              type="text"
              required
              placeholder="e.g. Christmas, Diwali, New Year's Day"
              value={holidayName}
              onChange={(e) => setHolidayName(e.target.value)}
            />
          </Field>
          <Field label="Holiday date">
            <Input
              type="date"
              required
              value={holidayDate}
              onChange={(e) => setHolidayDate(e.target.value)}
            />
          </Field>
          {holidayError && <p className="text-sm text-rose-600">{holidayError}</p>}
          <p className="text-xs text-slate-500">
            All company employees receive a paid holiday on this date. It will not be counted in LOP (Loss of Pay) leave calculations.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setHolidayModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={holidaySaving}>
              {holidaySaving ? "Saving..." : "Add holiday"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deletingHoliday)}
        title="Remove holiday?"
        message={`Are you sure you want to remove ${deletingHoliday?.name ?? "this holiday"}?`}
        confirmLabel="Remove"
        danger
        onClose={() => setDeletingHoliday(null)}
        onConfirm={() => {
          if (deletingHoliday) deleteHoliday(deletingHoliday.id);
        }}
      />
    </div>
  );
}

function PasswordDetail({ password }: { password: string }) {
  const [show, setShow] = useState(true);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">Password</p>
      <div className="mt-1 flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1.5">
        <span className="font-mono text-sm font-semibold text-slate-800">
          {show ? password : "••••••••••••"}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShow(!show)}
            title={show ? "Hide password" : "Show password"}
            className="rounded p-1 text-slate-400 hover:text-slate-700 transition"
          >
            {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={copy}
            title="Copy password"
            className="rounded p-1 text-slate-400 hover:text-slate-700 transition"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) { return <div><p className="text-xs uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 break-words font-medium text-slate-800">{value}</p></div>; }
function EmptyManagerPage({ title, description }: { title: string; description: string }) { return <Card><CardBody className="py-16 text-center"><FileText className="mx-auto h-8 w-8 text-slate-300" /><h1 className="mt-3 text-lg font-semibold text-slate-900">{title}</h1><p className="mt-1 text-sm text-slate-500">{description}</p><Link href="/manager/employees" className="mt-5 inline-flex text-sm font-medium text-indigo-600">Return to employees</Link></CardBody></Card>; }
function AttendanceTable({ records }: { records: AttendanceRecord[] }) { return <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3 text-left">Date</th><th className="px-5 py-3 text-left">Status</th><th className="px-5 py-3 text-left">Check in</th><th className="px-5 py-3 text-left">Check out</th><th className="px-5 py-3 text-left">Hours</th></tr></thead><tbody>{records.map((record) => <tr key={record.id} className="border-t border-slate-100"><td className="px-5 py-3">{formatDate(record.date)}</td><td className="px-5 py-3"><AttendanceBadge status={record.status} /></td><td className="px-5 py-3">{formatTime(record.checkIn)}</td><td className="px-5 py-3">{formatTime(record.checkOut)}</td><td className="px-5 py-3">{formatMinutes(record.workingMinutes)}</td></tr>)}</tbody></table></div>; }
function AttendanceTeamTable({ records, employees, departments }: { records: AttendanceRecord[]; employees: Employee[]; departments: Department[] }) { return <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3 text-left">Employee</th><th className="px-4 py-3 text-left">Department</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Check in</th><th className="px-4 py-3 text-left">Check out</th></tr></thead><tbody>{records.map((record) => { const employee = employeeFor(record, employees); return <tr key={record.id} className="border-t border-slate-100"><td className="px-4 py-3"><Link href={`/manager/employees/${employee ? fullName(employee).toLowerCase().replace(/\s+/g, "-") : "unknown"}`} className="flex items-center gap-3 hover:text-indigo-600"><Avatar employee={employee ?? employees[0]} size="sm" /><span className="font-medium">{employee ? fullName(employee) : "Employee"}</span></Link></td><td className="px-4 py-3">{departments.find((department) => department.id === employee?.departmentId)?.name ?? "—"}</td><td className="px-4 py-3"><AttendanceBadge status={record.status} /></td><td className="px-4 py-3">{formatTime(record.checkIn)}</td><td className="px-4 py-3">{formatTime(record.checkOut)}</td></tr>; })}</tbody></table></div>; }
