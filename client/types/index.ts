export type Role = "manager" | "employee";

export type EmployeeStatus = "active" | "inactive";

export type AttendanceStatus = "present" | "absent" | "late" | "holiday" | "leave";

export type LeaveType = "annual" | "sick" | "casual";

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface Company {
  id: string;
  name: string;
  code: string;
  industry: string;
  headquarters: string;
  timezone: string;
  workStart: string;
  lateAfter: string;
  workEnd: string;
  logoInitials: string;
}

export interface CompanySettings {
  companyId: string;
  allowSelfCheckIn: boolean;
  requireLeaveReason: boolean;
  notifyManagersOnLeave: boolean;
}

export interface User {
  id: string;
  companyId: string;
  email: string;
  role: Role;
  employeeId: string | null;
}

export interface Employee {
  id: string;
  companyId: string;
  userId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentId: string;
  jobTitle: string;
  managerId: string | null;
  joiningDate: string;
  status: EmployeeStatus;
  avatarHue: number;
  password?: string;
}

export interface Department {
  id: string;
  companyId: string;
  name: string;
  description: string;
}

export interface AttendanceRecord {
  id: string;
  companyId: string;
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  checkIn: string | null;
  checkOut: string | null;
  workingMinutes: number;
}

export interface LeaveBalance {
  employeeId: string;
  companyId: string;
  annual: number;
  sick: number;
  casual: number;
}

export interface LeaveRequest {
  id: string;
  companyId: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  rejectionReason?: string;
  reviewedBy?: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  companyId: string;
  title: string;
  body: string;
  authorId: string;
  publishedAt: string;
}

export interface ActivityItem {
  id: string;
  companyId: string;
  message: string;
  createdAt: string;
}

export interface Session {
  userId: string;
  companyId: string;
  role: Role;
  email: string;
}

export interface DemoDataset {
  version: number;
  companies: Company[];
  settings: CompanySettings[];
  users: User[];
  employees: Employee[];
  departments: Department[];
  attendance: AttendanceRecord[];
  leaveBalances: LeaveBalance[];
  leaveRequests: LeaveRequest[];
  announcements: Announcement[];
  activities: ActivityItem[];
}

export interface LoginInput {
  email: string;
  phone: string;
  password: string;
}

export interface EmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentId: string;
  jobTitle: string;
  managerId: string | null;
  joiningDate: string;
  status: EmployeeStatus;
}

export interface LeaveInput {
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface DepartmentInput {
  name: string;
  description: string;
}

export interface AnnouncementInput {
  title: string;
  body: string;
}

export interface ProfileUpdate {
  email?: string;
  phone?: string;
}

export const DATASET_VERSION = 3;
