"use client";

import { DATASET_VERSION } from "@/types";
import { eachDate, isWeekend, minutesBetween, nowTime, todayISO, workingDaysBetween } from "@/lib/dates";
import { createId } from "@/lib/ids";
import { fullName } from "@/lib/names";
import { apiCreateEmployee, apiDeleteEmployee, apiLogin, apiLogout, apiUpdateEmployee, apiUpdateEmployeeStatus } from "@/lib/api";
import type { LoginResponse } from "@/lib/api";
import { loadDataset, loadSession, resetDataset, saveDataset, saveSession } from "@/lib/storage";
import type {
  AnnouncementInput,
  AttendanceStatus,
  CompanySettings,
  DemoDataset,
  DepartmentInput,
  EmployeeInput,
  LeaveInput,
  LeaveType,
  LoginInput,
  ProfileUpdate,
  Role,
  Session,
} from "@/types";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface ToastItem {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface DemoContextValue {
  ready: boolean;
  dataset: DemoDataset;
  session: Session | null;
  toasts: ToastItem[];
  dismissToast: (id: string) => void;
  login: (input: LoginInput) => Promise<{ ok: true; role: Role } | { ok: false; error: string }>;
  logout: () => void;
  resetDemo: () => void;
  checkIn: () => void;
  checkOut: () => void;
  applyLeave: (input: LeaveInput) => string | null;
  cancelLeave: (id: string) => void;
  approveLeave: (id: string) => void;
  rejectLeave: (id: string, reason: string) => void;
  addEmployee: (input: EmployeeInput) => string | null;
  updateEmployee: (id: string, input: EmployeeInput) => string | null;
  setEmployeeStatus: (id: string, status: "active" | "inactive") => void;
  deleteEmployee: (id: string) => void;
  addDepartment: (input: DepartmentInput) => string | null;
  updateDepartment: (id: string, input: DepartmentInput) => string | null;
  deleteDepartment: (id: string) => string | null;
  addAnnouncement: (input: AnnouncementInput) => string | null;
  updateAnnouncement: (id: string, input: AnnouncementInput) => string | null;
  deleteAnnouncement: (id: string) => void;
  updateProfile: (input: ProfileUpdate) => string | null;
  updateSettings: (input: Partial<CompanySettings>) => void;
  updateCompanyName: (name: string) => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);
const EMPTY_DATASET: DemoDataset = {
  version: DATASET_VERSION,
  companies: [],
  settings: [],
  users: [],
  employees: [],
  departments: [],
  attendance: [],
  leaveBalances: [],
  leaveRequests: [],
  announcements: [],
  activities: [],
};

function pushActivity(dataset: DemoDataset, companyId: string, message: string): DemoDataset {
  return {
    ...dataset,
    activities: [
      {
        id: createId("act"),
        companyId,
        message,
        createdAt: new Date().toISOString(),
      },
      ...dataset.activities,
    ].slice(0, 40),
  };
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [dataset, setDataset] = useState<DemoDataset>(EMPTY_DATASET);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    // Rehydrate browser-only local storage after hydration to keep SSR output stable.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDataset(loadDataset());
    setSession(loadSession());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveDataset(dataset);
  }, [dataset, ready]);

  const toast = useCallback((type: ToastItem["type"], message: string) => {
    const id = createId("toast");
    setToasts((current) => [...current, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const persistSession = useCallback((next: Session | null) => {
    setSession(next);
    saveSession(next);
  }, []);

  const login = useCallback(
    async (input: LoginInput) => {
      const email = input.email.trim().toLowerCase();
      let authenticated: LoginResponse;
      try {
        authenticated = await apiLogin(input);
      } catch (error) {
        return { ok: false as const, error: error instanceof Error ? error.message : "Unable to reach the backend." };
      }
      const company = dataset.companies.find((item) => item.code === authenticated.company.code);
      if (!company) {
        apiLogout();
        return { ok: false as const, error: "This workspace is not available in the current application dataset." };
      }
      const existingUser = dataset.users.find((item) => item.email.toLowerCase() === email);
      const existingEmployee = existingUser?.employeeId
        ? dataset.employees.find((item) => item.id === existingUser.employeeId && item.companyId === company.id)
        : undefined;
      const userId = existingUser?.id ?? `api-user-${authenticated.session.userId}`;
      const employeeId = existingEmployee?.id ?? `api-employee-${String(authenticated.employee.id)}`;
      const departmentId = existingEmployee?.departmentId
        ?? dataset.departments.find((item) => item.companyId === company.id)?.id
        ?? "";
      if (!existingEmployee) {
        const employee = {
          id: employeeId,
          companyId: company.id,
          userId,
          employeeCode: String(authenticated.employee.employeeCode ?? ""),
          firstName: String(authenticated.employee.firstName ?? ""),
          lastName: String(authenticated.employee.lastName ?? ""),
          email: authenticated.session.email,
          phone: String(authenticated.employee.phone ?? ""),
          departmentId,
          jobTitle: String(authenticated.employee.jobTitle ?? ""),
          managerId: null,
          joiningDate: String(authenticated.employee.joiningDate ?? ""),
          status: authenticated.employee.status === "inactive" ? "inactive" as const : "active" as const,
          avatarHue: Number(authenticated.employee.avatarHue ?? 220),
          password: input.password,
        };
        const user = {
          id: userId,
          companyId: company.id,
          email: authenticated.session.email,
          role: authenticated.session.role,
          employeeId,
        };
        setDataset((current) => ({
          ...current,
          users: [...current.users.filter((item) => item.email.toLowerCase() !== email), user],
          employees: [...current.employees.filter((item) => item.email.toLowerCase() !== email), employee],
        }));
      } else {
        setDataset((current) => ({
          ...current,
          users: current.users.map((item) => item.id === existingUser?.id ? { ...item, role: authenticated.session.role } : item),
          employees: current.employees.map((item) => item.email.toLowerCase() === email ? { ...item, password: input.password } : item),
        }));
      }
      persistSession({
        userId,
        companyId: company.id,
        role: authenticated.session.role,
        email: authenticated.session.email,
      });
      toast("success", `Signed in to ${company.name} as ${authenticated.session.role}.`);
      return { ok: true as const, role: authenticated.session.role };
    },
    [dataset.companies, dataset.departments, dataset.employees, dataset.users, persistSession, toast],
  );

  const logout = useCallback(() => {
    apiLogout();
    persistSession(null);
    toast("info", "You have been signed out.");
  }, [persistSession, toast]);

  const resetDemo = useCallback(() => {
    const next = resetDataset();
    setDataset(next);
    persistSession(null);
    toast("success", "Demo data restored to the original dataset.");
  }, [persistSession, toast]);

  const mutate = useCallback(
    (updater: (current: DemoDataset) => DemoDataset, message?: string, type: ToastItem["type"] = "success") => {
      setDataset((current) => updater(current));
      if (message) toast(type, message);
    },
    [toast],
  );

  const currentEmployeeId = session
    ? dataset.users.find((user) => user.id === session.userId)?.employeeId
    : null;

  const checkIn = useCallback(() => {
    if (!session || !currentEmployeeId) return;
    const date = todayISO();
    const time = nowTime();
    const company = dataset.companies.find((item) => item.id === session.companyId);
    const lateAfter = company?.lateAfter ?? "09:15";
    const status: AttendanceStatus = time > lateAfter ? "late" : "present";
    mutate((current) => {
      const existing = current.attendance.find(
        (record) => record.employeeId === currentEmployeeId && record.date === date,
      );
      const attendance = existing
        ? current.attendance.map((record) =>
            record.id === existing.id
              ? { ...record, status, checkIn: time, checkOut: null, workingMinutes: 0 }
              : record,
          )
        : [
            ...current.attendance,
            {
              id: createId("att"),
              companyId: session.companyId,
              employeeId: currentEmployeeId,
              date,
              status,
              checkIn: time,
              checkOut: null,
              workingMinutes: 0,
            },
          ];
      return pushActivity({ ...current, attendance }, session.companyId, "An employee checked in.");
    }, status === "late" ? "Checked in (marked late)." : "Checked in for today.");
  }, [currentEmployeeId, dataset.companies, mutate, session]);

  const checkOut = useCallback(() => {
    if (!session || !currentEmployeeId) return;
    const date = todayISO();
    const time = nowTime();
    mutate((current) => {
      const attendance = current.attendance.map((record) => {
        if (record.employeeId !== currentEmployeeId || record.date !== date || !record.checkIn) {
          return record;
        }
        return {
          ...record,
          checkOut: time,
          workingMinutes: Math.max(0, minutesBetween(record.checkIn, time)),
        };
      });
      return pushActivity({ ...current, attendance }, session.companyId, "An employee checked out.");
    }, "Checked out for today.");
  }, [currentEmployeeId, mutate, session]);

  const applyLeave = useCallback(
    (input: LeaveInput) => {
      if (!session || !currentEmployeeId) return "You must be signed in.";
      if (!input.startDate || !input.endDate) return "Start and end dates are required.";
      if (input.endDate < input.startDate) return "End date cannot be before the start date.";
      if (!input.reason.trim()) return "Please add a reason for this request.";
      const days = workingDaysBetween(input.startDate, input.endDate);
      if (days < 1) return "The selected range has no working days.";
      const balance = dataset.leaveBalances.find((item) => item.employeeId === currentEmployeeId);
      if (!balance || balance[input.type] < days) return "Not enough leave balance for this request.";
      mutate((current) => {
        const next: DemoDataset = {
          ...current,
          leaveRequests: [
            {
              id: createId("leave"),
              companyId: session.companyId,
              employeeId: currentEmployeeId,
              type: input.type,
              startDate: input.startDate,
              endDate: input.endDate,
              days,
              reason: input.reason.trim(),
              status: "pending",
              createdAt: new Date().toISOString(),
            },
            ...current.leaveRequests,
          ],
        };
        return pushActivity(next, session.companyId, "A leave request was submitted.");
      }, "Leave request submitted.");
      return null;
    },
    [currentEmployeeId, dataset.leaveBalances, mutate, session],
  );

  const cancelLeave = useCallback(
    (id: string) => {
      if (!session) return;
      mutate((current) => ({
        ...current,
        leaveRequests: current.leaveRequests.map((request) =>
          request.id === id && request.companyId === session.companyId && request.status === "pending"
            ? { ...request, status: "cancelled" }
            : request,
        ),
      }), "Leave request cancelled.");
    },
    [mutate, session],
  );

  const markLeaveAttendance = (current: DemoDataset, employeeId: string, companyId: string, start: string, end: string) => {
    const dates = eachDate(start, end).filter((date) => !isWeekend(new Date(`${date}T00:00:00`)));
    let attendance = [...current.attendance];
    for (const date of dates) {
      const existing = attendance.find((record) => record.employeeId === employeeId && record.date === date);
      if (existing) {
        attendance = attendance.map((record) =>
          record.id === existing.id
            ? { ...record, status: "leave", checkIn: null, checkOut: null, workingMinutes: 0 }
            : record,
        );
      } else {
        attendance.push({
          id: createId("att"),
          companyId,
          employeeId,
          date,
          status: "leave",
          checkIn: null,
          checkOut: null,
          workingMinutes: 0,
        });
      }
    }
    return attendance;
  };

  const approveLeave = useCallback(
    (id: string) => {
      if (!session) return;
      mutate((current) => {
        const request = current.leaveRequests.find((item) => item.id === id && item.companyId === session.companyId);
        if (!request) return current;
        const reviewer = current.users.find((user) => user.id === session.userId)?.employeeId ?? session.userId;
        const leaveBalances = current.leaveBalances.map((balance) =>
          balance.employeeId === request.employeeId
            ? { ...balance, [request.type]: Math.max(0, balance[request.type] - request.days) }
            : balance,
        );
        const next = {
          ...current,
          leaveBalances,
          leaveRequests: current.leaveRequests.map((item) =>
            item.id === id ? { ...item, status: "approved" as const, reviewedBy: reviewer } : item,
          ),
          attendance: markLeaveAttendance(current, request.employeeId, session.companyId, request.startDate, request.endDate),
        };
        return pushActivity(next, session.companyId, "A leave request was approved.");
      }, "Leave request approved.");
    },
    [mutate, session],
  );

  const rejectLeave = useCallback(
    (id: string, reason: string) => {
      if (!session) return;
      mutate((current) => {
        const reviewer = current.users.find((user) => user.id === session.userId)?.employeeId ?? session.userId;
        const next = {
          ...current,
          leaveRequests: current.leaveRequests.map((item) =>
            item.id === id && item.companyId === session.companyId
              ? { ...item, status: "rejected" as const, rejectionReason: reason, reviewedBy: reviewer }
              : item,
          ),
        };
        return pushActivity(next, session.companyId, "A leave request was rejected.");
      }, "Leave request rejected.");
    },
    [mutate, session],
  );

  const addEmployee = useCallback(
    (input: EmployeeInput) => {
      if (!session) return "Not signed in.";
      const email = input.email.trim().toLowerCase();
      if (!input.firstName.trim() || !input.lastName.trim()) return "First and last name are required.";
      if (!email.includes("@")) return "Enter a valid email address.";
      if (dataset.users.some((user) => user.companyId === session.companyId && user.email.toLowerCase() === email)) {
        return "An account with this email already exists in this company.";
      }
      if (!input.departmentId) return "Select a department.";
      if (!input.jobTitle.trim()) return "Job title is required.";
      if (!input.joiningDate) return "Joining date is required.";

      mutate((current) => {
        const employeeId = createId("emp");
        const userId = createId("user");
        const company = current.companies.find((item) => item.id === session.companyId);
        const codePrefix = company?.code === "BRIGHT" ? "BRT" : company?.code ?? "EMP";
        const count = current.employees.filter((item) => item.companyId === session.companyId).length + 1010;
        const employee = {
          id: employeeId,
          companyId: session.companyId,
          userId,
          employeeCode: `${codePrefix}-${count}`,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          email,
          phone: input.phone.trim(),
          departmentId: input.departmentId,
          jobTitle: input.jobTitle.trim(),
          managerId: input.managerId,
          joiningDate: input.joiningDate,
          status: input.status,
          avatarHue: Math.floor(Math.random() * 360),
          password: (input.firstName.trim() + input.lastName.trim().replace(/[^a-zA-Z0-9]/g, "")).toLowerCase(),
        };
        const next: DemoDataset = {
          ...current,
          users: [
            ...current.users,
            {
              id: userId,
              companyId: session.companyId,
              email,
              role: "employee",
              employeeId,
            },
          ],
          employees: [...current.employees, employee],
          leaveBalances: [
            ...current.leaveBalances,
            { employeeId, companyId: session.companyId, annual: 18, sick: 10, casual: 6 },
          ],
        };
        return pushActivity(next, session.companyId, `${fullName(employee)} was added to the directory.`);
      }, "Employee added.");
      void apiCreateEmployee(input).catch((error) => {
        toast("error", error instanceof Error ? error.message : "Employee account could not be created in the backend.");
      });
      return null;
    },
    [dataset.users, mutate, session, toast],
  );

  const updateEmployee = useCallback(
    (id: string, input: EmployeeInput) => {
      if (!session) return "Not signed in.";
      if (!input.firstName.trim() || !input.lastName.trim()) return "First and last name are required.";
      if (!input.departmentId) return "Select a department.";
      mutate((current) => {
        const employees = current.employees.map((employee) =>
          employee.id === id && employee.companyId === session.companyId
            ? {
                ...employee,
                firstName: input.firstName.trim(),
                lastName: input.lastName.trim(),
                phone: input.phone.trim(),
                departmentId: input.departmentId,
                jobTitle: input.jobTitle.trim(),
                managerId: input.managerId,
                joiningDate: input.joiningDate,
                status: input.status,
              }
            : employee,
        );
        return { ...current, employees };
      }, "Employee details updated.");
      const target = dataset.employees.find((item) => item.id === id);
      if (target) void apiUpdateEmployee(target.email, input).catch(() => undefined);
      return null;
    },
    [dataset.employees, mutate, session],
  );

  const setEmployeeStatus = useCallback(
    (id: string, status: "active" | "inactive") => {
      if (!session) return;
      mutate((current) => ({
        ...current,
        employees: current.employees.map((employee) =>
          employee.id === id && employee.companyId === session.companyId ? { ...employee, status } : employee,
        ),
      }), status === "active" ? "Employee activated." : "Employee deactivated.");
      const target = dataset.employees.find((item) => item.id === id);
      if (target) void apiUpdateEmployeeStatus(target.email, status).catch(() => undefined);
    },
    [dataset.employees, mutate, session],
  );

  const deleteEmployee = useCallback(
    (id: string) => {
      if (!session) return;
      const target = dataset.employees.find((item) => item.id === id);
      mutate((current) => {
        const employee = current.employees.find((item) => item.id === id);
        const next: DemoDataset = {
          ...current,
          employees: current.employees.filter((item) => item.id !== id || item.companyId !== session.companyId),
          users: current.users.filter((user) => user.employeeId !== id),
          attendance: current.attendance.filter((record) => record.employeeId !== id),
          leaveRequests: current.leaveRequests.filter((request) => request.employeeId !== id),
          leaveBalances: current.leaveBalances.filter((balance) => balance.employeeId !== id),
        };
        return pushActivity(
          next,
          session.companyId,
          employee ? `${fullName(employee)} was removed from the directory.` : "An employee was removed.",
        );
      }, "Employee deleted.");
      if (target) void apiDeleteEmployee(target.email).catch(() => undefined);
    },
    [dataset.employees, mutate, session],
  );

  const addDepartment = useCallback(
    (input: DepartmentInput) => {
      if (!session) return "Not signed in.";
      if (!input.name.trim()) return "Department name is required.";
      mutate((current) => ({
        ...current,
        departments: [
          ...current.departments,
          {
            id: createId("dept"),
            companyId: session.companyId,
            name: input.name.trim(),
            description: input.description.trim(),
          },
        ],
      }), "Department created.");
      return null;
    },
    [mutate, session],
  );

  const updateDepartment = useCallback(
    (id: string, input: DepartmentInput) => {
      if (!session) return "Not signed in.";
      if (!input.name.trim()) return "Department name is required.";
      mutate((current) => ({
        ...current,
        departments: current.departments.map((department) =>
          department.id === id && department.companyId === session.companyId
            ? { ...department, name: input.name.trim(), description: input.description.trim() }
            : department,
        ),
      }), "Department updated.");
      return null;
    },
    [mutate, session],
  );

  const deleteDepartment = useCallback(
    (id: string) => {
      if (!session) return "Not signed in.";
      const assigned = dataset.employees.some(
        (employee) => employee.companyId === session.companyId && employee.departmentId === id,
      );
      if (assigned) return "Reassign employees before deleting this department.";
      mutate((current) => ({
        ...current,
        departments: current.departments.filter(
          (department) => !(department.id === id && department.companyId === session.companyId),
        ),
      }), "Department deleted.");
      return null;
    },
    [dataset.employees, mutate, session],
  );

  const addAnnouncement = useCallback(
    (input: AnnouncementInput) => {
      if (!session) return "Not signed in.";
      if (!input.title.trim() || !input.body.trim()) return "Title and message are required.";
      const authorId = currentEmployeeId ?? session.userId;
      mutate((current) => {
        const next: DemoDataset = {
          ...current,
          announcements: [
            {
              id: createId("ann"),
              companyId: session.companyId,
              title: input.title.trim(),
              body: input.body.trim(),
              authorId,
              publishedAt: new Date().toISOString(),
            },
            ...current.announcements,
          ],
        };
        return pushActivity(next, session.companyId, "A company announcement was published.");
      }, "Announcement published.");
      return null;
    },
    [currentEmployeeId, mutate, session],
  );

  const updateAnnouncement = useCallback(
    (id: string, input: AnnouncementInput) => {
      if (!session) return "Not signed in.";
      if (!input.title.trim() || !input.body.trim()) return "Title and message are required.";
      mutate((current) => ({
        ...current,
        announcements: current.announcements.map((item) =>
          item.id === id && item.companyId === session.companyId
            ? { ...item, title: input.title.trim(), body: input.body.trim() }
            : item,
        ),
      }), "Announcement updated.");
      return null;
    },
    [mutate, session],
  );

  const deleteAnnouncement = useCallback(
    (id: string) => {
      if (!session) return;
      mutate((current) => ({
        ...current,
        announcements: current.announcements.filter(
          (item) => !(item.id === id && item.companyId === session.companyId),
        ),
      }), "Announcement deleted.");
    },
    [mutate, session],
  );

  const updateProfile = useCallback(
    (input: ProfileUpdate) => {
      if (!session || !currentEmployeeId) return "Not signed in.";
      if (!input.phone.trim()) return "Phone number is required.";
      mutate((current) => ({
        ...current,
        employees: current.employees.map((employee) =>
          employee.id === currentEmployeeId ? { ...employee, phone: input.phone.trim() } : employee,
        ),
      }), "Profile updated.");
      return null;
    },
    [currentEmployeeId, mutate, session],
  );

  const updateSettings = useCallback(
    (input: Partial<CompanySettings>) => {
      if (!session) return;
      mutate((current) => ({
        ...current,
        settings: current.settings.map((item) =>
          item.companyId === session.companyId ? { ...item, ...input } : item,
        ),
      }), "Workspace settings saved.");
    },
    [mutate, session],
  );

  const updateCompanyName = useCallback(
    (name: string) => {
      if (!session) return;
      mutate((current) => ({
        ...current,
        companies: current.companies.map((company) =>
          company.id === session.companyId ? { ...company, name } : company,
        ),
      }), "Company profile updated.");
    },
    [mutate, session],
  );

  const value = useMemo<DemoContextValue>(
    () => ({
      ready,
      dataset,
      session,
      toasts,
      dismissToast,
      login,
      logout,
      resetDemo,
      checkIn,
      checkOut,
      applyLeave,
      cancelLeave,
      approveLeave,
      rejectLeave,
      addEmployee,
      updateEmployee,
      setEmployeeStatus,
      deleteEmployee,
      addDepartment,
      updateDepartment,
      deleteDepartment,
      addAnnouncement,
      updateAnnouncement,
      deleteAnnouncement,
      updateProfile,
      updateSettings,
      updateCompanyName,
    }),
    [
      addAnnouncement,
      addDepartment,
      addEmployee,
      applyLeave,
      approveLeave,
      cancelLeave,
      checkIn,
      checkOut,
      dataset,
      deleteAnnouncement,
      deleteDepartment,
      deleteEmployee,
      dismissToast,
      login,
      logout,
      ready,
      rejectLeave,
      resetDemo,
      session,
      setEmployeeStatus,
      toasts,
      updateAnnouncement,
      updateCompanyName,
      updateDepartment,
      updateEmployee,
      updateProfile,
      updateSettings,
    ],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("useDemo must be used within DemoProvider");
  return value;
}

export function useCompanyData() {
  const { dataset, session } = useDemo();
  return useMemo(() => {
    if (!session) {
      return {
        company: null,
        settings: null,
        currentUser: null,
        currentEmployee: null,
        employees: [],
        departments: [],
        attendance: [],
        leaveBalances: [],
        leaveRequests: [],
        announcements: [],
        activities: [],
      };
    }

    const company = dataset.companies.find((item) => item.id === session.companyId) ?? null;
    const settings = dataset.settings.find((item) => item.companyId === session.companyId) ?? null;
    const currentUser = dataset.users.find((item) => item.id === session.userId) ?? null;
    const employees = dataset.employees.filter((item) => item.companyId === session.companyId);
    const currentEmployee = employees.find((item) => item.id === currentUser?.employeeId) ?? null;

    return {
      company,
      settings,
      currentUser,
      currentEmployee,
      employees,
      departments: dataset.departments.filter((item) => item.companyId === session.companyId),
      attendance: dataset.attendance.filter((item) => item.companyId === session.companyId),
      leaveBalances: dataset.leaveBalances.filter((item) => item.companyId === session.companyId),
      leaveRequests: dataset.leaveRequests.filter((item) => item.companyId === session.companyId),
      announcements: dataset.announcements.filter((item) => item.companyId === session.companyId),
      activities: dataset.activities.filter((item) => item.companyId === session.companyId),
    };
  }, [dataset, session]);
}

export function leaveLabel(type: LeaveType): string {
  if (type === "annual") return "Annual";
  if (type === "sick") return "Sick";
  return "Casual";
}
