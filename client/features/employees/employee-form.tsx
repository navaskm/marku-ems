"use client";

import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { fullName } from "@/lib/names";
import type { Department, Employee, EmployeeInput } from "@/types";
import { useState } from "react";

export function EmployeeForm({
  departments,
  managers,
  initial,
  onSubmit,
  onCancel,
}: {
  departments: Department[];
  managers: Employee[];
  initial?: Employee;
  onSubmit: (input: EmployeeInput) => string | null;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<EmployeeInput>({
    firstName: initial?.firstName ?? "",
    lastName: initial?.lastName ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    departmentId: initial?.departmentId ?? departments[0]?.id ?? "",
    jobTitle: initial?.jobTitle ?? "",
    managerId: initial?.managerId ?? null,
    joiningDate: initial?.joiningDate ?? "",
    status: initial?.status ?? "active",
  });
  // Manager and Status fields are intentionally excluded from the form
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const result = onSubmit(form);
        if (result) setError(result);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name">
          <Input value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
        </Field>
        <Field label="Last name">
          <Input value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={form.email}
            disabled={Boolean(initial)}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        </Field>
        <Field label="Department">
          <Select value={form.departmentId} onChange={(event) => setForm({ ...form, departmentId: event.target.value })}>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Job title">
          <Input value={form.jobTitle} onChange={(event) => setForm({ ...form, jobTitle: event.target.value })} />
        </Field>
        <Field label="Joining date">
          <Input type="date" value={form.joiningDate} onChange={(event) => setForm({ ...form, joiningDate: event.target.value })} />
        </Field>
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{initial ? "Save changes" : "Add employee"}</Button>
      </div>
    </form>
  );
}
