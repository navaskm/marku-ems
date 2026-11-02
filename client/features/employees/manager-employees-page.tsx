"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable, type Column } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { useCompanyData, useDemo } from "@/features/auth/demo-context";
import { EmployeeForm } from "@/features/employees/employee-form";
import { fullName } from "@/lib/names";
import type { Employee } from "@/types";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export function ManagerEmployeesPage() {
  const router = useRouter();
  const { addEmployee, updateEmployee, deleteEmployee } = useDemo();
  const { employees, departments } = useCompanyData();
  const [query, setQuery] = useState("");
  const [departmentId, setDepartmentId] = useState("all");
  const [title, setTitle] = useState("all");
  const [editing, setEditing] = useState<Employee | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Employee | null>(null);

  const staff = employees.filter((employee) => !employee.email.startsWith("owner@"));
  const titles = [...new Set(staff.map((employee) => employee.jobTitle))];
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return staff.filter((employee) => {
      if (departmentId !== "all" && employee.departmentId !== departmentId) return false;
      if (title !== "all" && employee.jobTitle !== title) return false;
      if (!needle) return true;
      return (
        fullName(employee).toLowerCase().includes(needle) ||
        employee.email.toLowerCase().includes(needle) ||
        employee.employeeCode.toLowerCase().includes(needle)
      );
    });
  }, [departmentId, query, staff, title]);

  const columns: Column<Employee>[] = [
    {
      key: "name",
      header: "Employee",
      sortable: true,
      sortValue: (row) => fullName(row),
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar employee={row} size="sm" />
          <p className="font-medium text-slate-900">{fullName(row)}</p>
        </div>
      ),
    },
    { key: "email", header: "Email", sortable: true, sortValue: (row) => row.email, render: (row) => row.email },
    {
      key: "department",
      header: "Department",
      sortable: true,
      sortValue: (row) => departments.find((item) => item.id === row.departmentId)?.name ?? "",
      render: (row) => departments.find((item) => item.id === row.departmentId)?.name ?? "—",
    },
    { key: "title", header: "Job title", sortable: true, sortValue: (row) => row.jobTitle, render: (row) => row.jobTitle },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => router.push(`/manager/employees/${fullName(row).toLowerCase().replace(/\s+/g, "-")}`)}
          >
            View
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(row)}>
            Edit
          </Button>
          <Button size="sm" variant="danger" onClick={() => setDeleting(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Employee Directory"
        description="View and manage all employees in your company."
        actions={<Button onClick={() => setCreating(true)}>Add employee</Button>}
      />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Input className="col-span-2 md:col-span-1" placeholder="Search name, email, or ID" value={query} onChange={(event) => setQuery(event.target.value)} />
        <Select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>
          <option value="all">All departments</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </Select>
        <Select value={title} onChange={(event) => setTitle(event.target.value)}>
          <option value="all">All job titles</option>
          {titles.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </div>
      <Card>
        <DataTable columns={columns} rows={filtered} rowKey={(row) => row.id} />
      </Card>
      <Modal open={creating} title="Add employee" onClose={() => setCreating(false)} className="max-w-2xl">
        <EmployeeForm
          departments={departments}
          managers={employees}
          onCancel={() => setCreating(false)}
          onSubmit={(input) => {
            const error = addEmployee(input);
            if (!error) setCreating(false);
            return error;
          }}
        />
      </Modal>
      <Modal open={Boolean(editing)} title="Edit employee" onClose={() => setEditing(null)} className="max-w-2xl">
        {editing ? (
          <EmployeeForm
            initial={editing}
            departments={departments}
            managers={employees.filter((item) => item.id !== editing.id)}
            onCancel={() => setEditing(null)}
            onSubmit={(input) => {
              const error = updateEmployee(editing.id, input);
              if (!error) setEditing(null);
              return error;
            }}
          />
        ) : null}
      </Modal>
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete employee?"
        message={`This removes ${deleting ? fullName(deleting) : "the employee"} and related demo records from this company only.`}
        confirmLabel="Delete"
        danger
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) deleteEmployee(deleting.id);
        }}
      />
    </div>
  );
}
