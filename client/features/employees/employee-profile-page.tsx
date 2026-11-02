"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { useCompanyData, useDemo } from "@/features/auth/demo-context";
import { PasswordChangeForm } from "@/features/auth/password-change-form";
import { formatDate } from "@/lib/dates";
import { fullName } from "@/lib/names";
import { useState } from "react";

export function EmployeeProfilePage() {
  const { updateProfile } = useDemo();
  const { currentEmployee, departments } = useCompanyData();
  const [phone, setPhone] = useState(currentEmployee?.phone ?? "");
  const [error, setError] = useState<string | null>(null);
  if (!currentEmployee) return null;

  const department = departments.find((item) => item.id === currentEmployee.departmentId);

  return (
    <div>
      <PageHeader title="My profile" />
      <div className="grid gap-6 xl:grid-cols-[20rem_1fr]">
        <Card>
          <CardBody className="flex flex-col items-center py-8 text-center">
            <Avatar employee={currentEmployee} size="xl" />
            <h2 className="mt-4 text-lg font-semibold text-slate-900">{fullName(currentEmployee)}</h2>
            <p className="text-sm text-slate-500">{currentEmployee.jobTitle}</p>
            <div className="mt-3">
              <StatusBadge status={currentEmployee.status} />
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Employment details" />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <ReadOnly label="Email" value={currentEmployee.email} />
            <ReadOnly label="Department" value={department?.name ?? "Unassigned"} />
            <ReadOnly label="Job title" value={currentEmployee.jobTitle} />
            <ReadOnly label="Joining date" value={formatDate(currentEmployee.joiningDate)} />
            <form
              className="sm:col-span-2 space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                const result = updateProfile({ phone });
                setError(result);
              }}
            >
              <Field label="Phone number">
                <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
              </Field>
              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              <Button type="submit">Save personal information</Button>
            </form>
            <div className="sm:col-span-2 space-y-4 border-t border-slate-100 pt-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Password</h3>
                <p className="mt-1 text-sm text-slate-500">Change your password for this account.</p>
              </div>
              <PasswordChangeForm />
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}
