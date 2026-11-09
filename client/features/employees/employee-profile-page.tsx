"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { useCompanyData } from "@/features/auth/demo-context";
import { AccountSettingsForm } from "@/features/auth/account-settings-form";
import { PasswordChangeForm } from "@/features/auth/password-change-form";
import { formatDate } from "@/lib/dates";
import { fullName } from "@/lib/names";

export function EmployeeProfilePage() {
  const { currentEmployee, departments } = useCompanyData();
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
            <ReadOnly label="Department" value={department?.name ?? "Unassigned"} />
            <ReadOnly label="Job title" value={currentEmployee.jobTitle} />
            <ReadOnly label="Joining date" value={formatDate(currentEmployee.joiningDate)} />
            <ReadOnly label="Employee code" value={currentEmployee.employeeCode} />

            <div className="sm:col-span-2 space-y-4 border-t border-slate-100 pt-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Sign-in details (Email & Phone)</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Update your email address or phone number. These will be required on your next login.
                </p>
              </div>
              <AccountSettingsForm />
            </div>

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
    <div className="flex items-center justify-between gap-2 sm:block">
      <p className="text-xs uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="text-right text-sm font-medium text-slate-800 sm:mt-1 sm:text-left">
        {value}
      </p>
    </div>
  );
}
