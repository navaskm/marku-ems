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
import { PasswordChangeForm } from "@/features/auth/password-change-form";
import { formatDate, formatMinutes, formatTime, relativeTime, todayISO } from "@/lib/dates";
import { fullName } from "@/lib/names";
import type { Announcement, AttendanceRecord, Department, Employee, LeaveRequest } from "@/types";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  ArrowLeft,
  Building2,
  Copy,
  Eye,
  EyeOff,
  Check,
  ClipboardList,
  Clock3,
  FileText,
  Megaphone,
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
  const { employees, departments, attendance } = useCompanyData();
  const employee = employeeFromSlug(employees, slug);
  if (!employee) {
    return <EmptyManagerPage title="Employee not found" description="This employee may have been removed from the directory." />;
  }

  const department = departments.find((item) => item.id === employee.departmentId);
  const records = attendance.filter((record) => record.employeeId === employee.id).sort((a, b) => b.date.localeCompare(a.date));
  const monthMinutes = records.filter((record) => record.date.startsWith(todayISO().slice(0, 7))).reduce((sum, record) => sum + record.workingMinutes, 0);

  return (
    <div>
      <PageHeader title={fullName(employee)} description={employee.jobTitle} actions={<Link href="/manager/employees" className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600"><ArrowLeft className="h-4 w-4" />Back to employees</Link>} />
      <div className="min-w-0 space-y-6">
        <Card>
          <CardBody className="flex flex-col items-center text-center">
            <Avatar employee={employee} size="xl" />

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              {fullName(employee)}
            </h2>

            <p className="text-sm text-slate-500">{employee.jobTitle}</p>

            <div className="mt-3">
              <StatusBadge status={employee.status} />
            </div>

            <div className="mt-6 grid w-full grid-cols-1 gap-4 border-t border-slate-100 pt-5 text-left text-sm sm:grid-cols-2">
              <Detail label="Email" value={employee.email} />

              <Detail label="Phone" value={employee.phone} />

              <Detail label="Department" value={department?.name ?? "Unassigned"} />

              <Detail label="Joined" value={formatDate(employee.joiningDate)} />

              <div className="sm:col-span-2 min-w-0">
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

        <div className="space-y-6">
          <div className="grid min-w-0 gap-4">
            <StatCard label="Hours this month" value={formatMinutes(monthMinutes)} icon={Clock3} />
          </div>
          <Card><CardHeader title="Recent attendance" /><CardBody className="px-0 py-0"><AttendanceTable records={records.slice(0, 8)} /></CardBody></Card>
        </div>
      </div>
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
  const { company, employees } = useCompanyData();
  if (!company) return null;
  const totalEmployees = employees.filter(
    (employee) => employee.status === "active" && !employee.email.startsWith("owner@"),
  ).length;

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
      <Card className="flex flex-1 flex-col md:max-w-2xl">
        <CardHeader title="Company profile" />

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
          </div>
        </CardBody>
      </Card>

      <Card className="flex flex-1 flex-col md:max-w-2xl">
        <CardHeader
          title="Password"
          description="Change your own sign-in password."
        />

        <CardBody className="flex-1">
          <PasswordChangeForm />
        </CardBody>
      </Card>
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
