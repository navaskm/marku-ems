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
  };
}

const people: PersonSeed[] = [
  person("Saleeth", "owner@marku.demo", "manager", "Owner, MarkU", "marku-management", null, "+91 98765 43210", 166, 0),
  person("Vithin", "manager@marku.demo", "manager", "HR Manager", "marku-hr", "marku-saleeth", "+91 98765 43211", 196, 1),
  person("Mubashira", "mubashira@marku.demo", "employee", "Sales Executive", "marku-sales", "marku-vithin", "+91 98765 43212", 242, 2),
  person("Angel", "angel@marku.demo", "employee", "Sales Executive", "marku-sales", "marku-vithin", "+91 98765 43213", 312, 3),
  person("Shafi", "shafi@marku.demo", "employee", "Digital Marketing Executive", "marku-digital-marketing", "marku-vithin", "+91 98765 43214", 28, 4),
  person("Rinshad", "rinshad@marku.demo", "employee", "Developer", "marku-development", "marku-vithin", "+91 98765 43215", 204, 5),
  person("Sana", "sana@marku.demo", "employee", "Digital Marketing Executive", "marku-digital-marketing", "marku-vithin", "+91 98765 43216", 348, 6),
  person("Navas", "navas@marku.demo", "employee", "Developer", "marku-development", "marku-vithin", "+91 98765 43217", 148, 7),
  person("Rahul", "rahul@marku.demo", "employee", "Digital Marketing Executive", "marku-digital-marketing", "marku-vithin", "+91 98765 43218", 80, 8),
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

export const DEMO_ACCOUNTS = [
  ["owner@marku.demo", "+91 98765 43210", "Saleeth", "manager"],
  ["manager@marku.demo", "+91 98765 43211", "Vithin", "manager"],
  ["mubashira@marku.demo", "+91 98765 43212", "Mubashira", "employee"],
  ["rinshad@marku.demo", "+91 98765 43215", "Rinshad", "employee"],
].map(([email, phone, name, role]) => ({
  company: "MarkU — The Life Design Academy",
  code: "MARKU",
  role: role as "manager" | "employee",
  email,
  phone,
  name,
}));
