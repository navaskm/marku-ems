import type { Employee } from "@/types";

export function fullName(employee: Pick<Employee, "firstName" | "lastName">): string {
  return `${employee.firstName} ${employee.lastName}`;
}

export function initials(employee: Pick<Employee, "firstName" | "lastName">): string {
  return `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`.toUpperCase();
}
