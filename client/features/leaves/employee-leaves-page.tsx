"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { LeaveBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/modal";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { leaveLabel, useCompanyData, useDemo } from "@/features/auth/demo-context";
import { formatDate } from "@/lib/dates";
import type { LeaveInput, LeaveRequest } from "@/types";
import { Palmtree } from "lucide-react";
import { useState } from "react";

export function EmployeeLeavesPage() {
  const { applyLeave, cancelLeave } = useDemo();
  const { currentEmployee, leaveBalances, leaveRequests } = useCompanyData();
  const [form, setForm] = useState<LeaveInput>({ type: "annual", startDate: "", endDate: "", reason: "" });
  const [error, setError] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  if (!currentEmployee) return null;

  const balance = leaveBalances.find((item) => item.employeeId === currentEmployee.id);
  const mine = leaveRequests
    .filter((request) => request.employeeId === currentEmployee.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <PageHeader title="Leave management" description="Submit time off and track request status." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Annual" value={balance?.annual ?? 0} icon={Palmtree} tone="indigo" />
        <StatCard label="Sick" value={balance?.sick ?? 0} icon={Palmtree} tone="sky" />
        <StatCard label="Casual" value={balance?.casual ?? 0} icon={Palmtree} tone="green" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Apply for leave" description="Working days only are counted against your balance." />
          <CardBody>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                const result = applyLeave(form);
                if (result) setError(result);
                else {
                  setError(null);
                  setForm({ type: "annual", startDate: "", endDate: "", reason: "" });
                }
              }}
            >
              <Field label="Leave type">
                <Select
                  value={form.type}
                  onChange={(event) => setForm({ ...form, type: event.target.value as LeaveInput["type"] })}
                >
                  <option value="annual">Annual</option>
                  <option value="sick">Sick</option>
                  <option value="casual">Casual</option>
                </Select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Start date">
                  <Input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
                </Field>
                <Field label="End date">
                  <Input type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
                </Field>
              </div>
              <Field label="Reason">
                <Textarea value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} />
              </Field>
              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              <Button type="submit">Submit request</Button>
            </form>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="My requests" />
          <CardBody className="space-y-3">
            {mine.map((request: LeaveRequest) => (
              <div key={request.id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {leaveLabel(request.type)} · {request.days} day{request.days === 1 ? "" : "s"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(request.startDate)} – {formatDate(request.endDate)}
                    </p>
                  </div>
                  <LeaveBadge status={request.status} />
                </div>
                <p className="mt-2 text-sm text-slate-600">{request.reason}</p>
                {request.rejectionReason ? (
                  <p className="mt-2 text-xs text-rose-600">Rejected: {request.rejectionReason}</p>
                ) : null}
                {request.status === "pending" ? (
                  <Button className="mt-3" size="sm" variant="outline" onClick={() => setCancelId(request.id)}>
                    Cancel request
                  </Button>
                ) : null}
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
      <ConfirmDialog
        open={Boolean(cancelId)}
        title="Cancel this request?"
        message="Pending leave will be withdrawn. Approved leave cannot be cancelled here."
        confirmLabel="Cancel request"
        danger
        onClose={() => setCancelId(null)}
        onConfirm={() => {
          if (cancelId) cancelLeave(cancelId);
        }}
      />
    </div>
  );
}
