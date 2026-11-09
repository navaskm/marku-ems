import type { Employee, User } from "@/types";
import { MARKU_ID } from "@/data/companies";

interface PersonSeed {
  id: string;
  email: string;
  role: User["role"];
  employeeCode: string;
  firstName: string;
  lastName: string;
  phone: string;
  departmentId: string;
  jobTitle: string;
  managerId: string | null;
  joiningDate: string;
  avatarHue: number;
  salary: number;
}

function person(
  name: string,
  email: string,
  role: User["role"],
  jobTitle: string,
  departmentId: string,
  managerId: string | null,
  phone: string,
  avatarHue: number,
  index: number,
  salary: number = 30000,
): PersonSeed {
  return {
    id: `marku-${name.toLowerCase()}`,
    email,
    role,
    employeeCode: `MARKU-${String(1001 + index).padStart(4, "0")}`,
    firstName: name,
    lastName: "",
    phone,
    departmentId,
    jobTitle,
    managerId,
    joiningDate: `202${index < 2 ? 1 + index : 2 + (index % 3)}-${String((index % 9) + 1).padStart(2, "0")}-09`,
    avatarHue,
    salary,
  };
}

const people: PersonSeed[] = [
  person("Saleeth", "owner@marku.demo", "manager", "Owner, MarkU", "marku-management", null, "+91 98765 43210", 166, 0, 75000),
  person("Vithin", "vithin@marku.demo", "employee", "HR Manager", "marku-hr", "marku-saleeth", "+91 98765 43211", 196, 1, 45000),
  person("Mubashira", "mubashira@marku.demo", "employee", "Sales Executive", "marku-sales", "marku-vithin", "+91 98765 43212", 242, 2, 32000),
  person("Angel", "angel@marku.demo", "employee", "Sales Executive", "marku-sales", "marku-vithin", "+91 98765 43213", 312, 3, 32000),
  person("Shafi", "shafi@marku.demo", "employee", "Digital Marketing Executive", "marku-digital-marketing", "marku-vithin", "+91 98765 43214", 28, 4, 30000),
  person("Rinshad", "rinshad@marku.demo", "employee", "Developer", "marku-development", "marku-vithin", "+91 98765 43215", 204, 5, 42000),
  person("Sana", "sana@marku.demo", "employee", "Digital Marketing Executive", "marku-digital-marketing", "marku-vithin", "+91 98765 43216", 348, 6, 30000),
  person("Navas", "navas@marku.demo", "employee", "Developer", "marku-development", "marku-vithin", "+91 98765 43217", 148, 7, 40000),
  person("Rahul", "rahul@marku.demo", "employee", "Digital Marketing Executive", "marku-digital-marketing", "marku-vithin", "+91 98765 43218", 80, 8, 30000),
];

export const users: User[] = people.map((person) => ({
  id: `user-${person.id}`,
  companyId: MARKU_ID,
  email: person.email,
  role: person.role,
  employeeId: person.id,
}));

export const employees: Employee[] = people.map((person) => ({
  ...person,
  companyId: MARKU_ID,
  userId: `user-${person.id}`,
  status: "active",
  password: person.firstName.toLowerCase() || "marku123",
}));