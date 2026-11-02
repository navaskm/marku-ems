import type { Employee, EmployeeInput, LoginInput } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export class ApiError extends Error {
  constructor(message: string, public status = 500) { super(message); }
}

export interface LoginResponse {
  token: string;
  session: { userId: string; companyId: string; role: "manager" | "employee"; email: string };
  employee: Record<string, unknown>;
  company: { id: number; name: string; code: string; industry: string; headquarters: string; timezone: string };
}

async function request<T>(path: string, init: RequestInit = {}, authenticated = true): Promise<T> {
  const token = authenticated && typeof window !== "undefined" ? window.localStorage.getItem("workline.apiToken") : null;
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Token ${token}` } : {}), ...init.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(body.detail ?? (Object.values(body).flat().join(" ") || "Request failed."), response.status);
  return body as T;
}

export async function apiLogin(input: LoginInput) {
  const result = await request<LoginResponse>("/auth/login/", { method: "POST", body: JSON.stringify(input) }, false);
  window.localStorage.setItem("workline.apiToken", result.token);
  return result;
}

export async function apiSetPassword(uid: string, token: string, newPassword: string) {
  return request<{ detail: string }>("/auth/password/setup/", {
    method: "POST",
    body: JSON.stringify({ uid, token, newPassword }),
  }, false);
}

export async function apiChangePassword(oldPassword: string, newPassword: string) {
  const result = await request<{ token: string }>("/auth/password/change/", {
    method: "POST",
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  window.localStorage.setItem("workline.apiToken", result.token);
  return result;
}

export function apiLogout() { if (typeof window !== "undefined") window.localStorage.removeItem("workline.apiToken"); }

function normalizeEmployee(employee: Record<string, unknown>): Employee {
  return {
    id: String(employee.id), companyId: String(employee.companyId), userId: String(employee.userId), employeeCode: String(employee.employeeCode),
    firstName: String(employee.firstName), lastName: String(employee.lastName), email: String(employee.email), phone: String(employee.phone),
    departmentId: String(employee.departmentId), jobTitle: String(employee.jobTitle), managerId: employee.managerId == null ? null : String(employee.managerId),
    joiningDate: String(employee.joiningDate), status: employee.status as Employee["status"], avatarHue: Number(employee.avatarHue),
    password: employee.password ? String(employee.password) : undefined,
  };
}

export async function apiCreateEmployee(input: EmployeeInput) {
  return normalizeEmployee(await request<Record<string, unknown>>("/employees/", { method: "POST", body: JSON.stringify(input) }));
}
export async function apiUpdateEmployee(id: string, input: EmployeeInput) {
  return normalizeEmployee(await request<Record<string, unknown>>(`/employees/${id}/`, { method: "PUT", body: JSON.stringify(input) }));
}
export async function apiUpdateEmployeeStatus(id: string, status: Employee["status"]) {
  return normalizeEmployee(await request<Record<string, unknown>>(`/employees/${id}/`, { method: "PATCH", body: JSON.stringify({ status }) }));
}
export function apiDeleteEmployee(id: string) { return request<void>(`/employees/${id}/`, { method: "DELETE" }); }
