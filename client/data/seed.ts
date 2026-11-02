import { companies, companySettings, departments } from "@/data/companies";
import { employees, users } from "@/data/people";
import { eachDate, isWeekend, minutesBetween, monthRange, todayISO, toISODate } from "@/lib/dates";
import { seededRandom } from "@/lib/ids";
import { fullName } from "@/lib/names";
import {
  DATASET_VERSION,
  type Announcement,
  type AttendanceRecord,
  type AttendanceStatus,
  type DemoDataset,
  type Employee,
  type LeaveBalance,
  type LeaveRequest,
} from "@/types";

const HOLIDAYS = new Set(["2026-01-01", "2026-05-25", "2026-07-04", "2026-09-07", "2026-11-26", "2026-12-25"]);

function attendanceWindow(): { start: string; end: string } {
  const today = new Date();
  const previous = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  return { start: toISODate(previous), end: todayISO() };
}

function buildLeaveBalances(staff: Employee[]): LeaveBalance[] {
  return staff.map((employee) => {
    const random = seededRandom(`balance-${employee.id}`);
    return {
      employeeId: employee.id,
      companyId: employee.companyId,
      annual: 12 + Math.floor(random() * 8),
      sick: 6 + Math.floor(random() * 5),
      casual: 3 + Math.floor(random() * 4),
    };
  });
}

function buildLeaveRequests(staff: Employee[], managers: Employee[]): LeaveRequest[] {
  const requests: LeaveRequest[] = [];
  const templates: Array<Omit<LeaveRequest, "id" | "companyId" | "employeeId" | "reviewedBy">> = [
    {
      type: "annual",
      startDate: "2026-10-08",
      endDate: "2026-10-10",
      days: 3,
      reason: "Family travel already booked during the school break.",
      status: "approved",
      createdAt: "2026-09-22T14:10:00.000Z",
    },
    {
      type: "sick",
      startDate: "2026-10-16",
      endDate: "2026-10-16",
      days: 1,
      reason: "Recovering from a fever and following the stay-home policy.",
      status: "approved",
      createdAt: "2026-10-15T08:40:00.000Z",
    },
    {
      type: "casual",
      startDate: "2026-10-23",
      endDate: "2026-10-23",
      days: 1,
      reason: "Personal appointment that cannot be moved.",
      status: "pending",
      createdAt: "2026-10-17T11:20:00.000Z",
    },
    {
      type: "annual",
      startDate: "2026-11-04",
      endDate: "2026-11-06",
      days: 3,
      reason: "Attending a relative's wedding out of town.",
      status: "pending",
      createdAt: "2026-10-14T16:05:00.000Z",
    },
    {
      type: "casual",
      startDate: "2026-09-18",
      endDate: "2026-09-18",
      days: 1,
      reason: "Home maintenance visit that requires being on-site.",
      status: "rejected",
      rejectionReason: "Sprint demo is scheduled that afternoon. Please pick another day.",
      createdAt: "2026-09-12T09:15:00.000Z",
    },
    {
      type: "annual",
      startDate: "2026-09-03",
      endDate: "2026-09-04",
      days: 2,
      reason: "Long weekend to relocate to a new apartment.",
      status: "approved",
      createdAt: "2026-08-20T13:45:00.000Z",
    },
  ];

  const byCompany = new Map<string, Employee[]>();
  for (const employee of staff) {
    if (employee.email.startsWith("manager@") || employee.email.startsWith("owner@")) continue;
    const list = byCompany.get(employee.companyId) ?? [];
    list.push(employee);
    byCompany.set(employee.companyId, list);
  }

  for (const [companyId, companyStaff] of byCompany) {
    const manager = managers.find((item) => item.companyId === companyId);
    companyStaff.slice(0, 8).forEach((employee, index) => {
      const template = templates[index % templates.length];
      requests.push({
        ...template,
        id: `leave-${employee.id}-${index}`,
        companyId,
        employeeId: employee.id,
        reviewedBy: template.status === "pending" ? undefined : manager?.id,
      });
    });
  }

  return requests;
}

function approvedLeaveDates(requests: LeaveRequest[], employeeId: string): Set<string> {
  const dates = new Set<string>();
  for (const request of requests) {
    if (request.employeeId !== employeeId || request.status !== "approved") continue;
    for (const date of eachDate(request.startDate, request.endDate)) {
      dates.add(date);
    }
  }
  return dates;
}

function pickStatus(random: () => number, onLeave: boolean, date: string, isToday: boolean, demoEmployee: boolean): AttendanceStatus {
  if (HOLIDAYS.has(date) || isWeekend(new Date(`${date}T00:00:00`))) return "holiday";
  if (onLeave) return "leave";
  if (isToday && demoEmployee) return "absent";
  const roll = random();
  if (roll < 0.07) return "absent";
  if (roll < 0.16) return "late";
  return "present";
}

function buildAttendance(staff: Employee[], requests: LeaveRequest[]): AttendanceRecord[] {
  const { start, end } = attendanceWindow();
  const today = todayISO();
  const records: AttendanceRecord[] = [];

  for (const employee of staff) {
    const random = seededRandom(`att-${employee.id}`);
    const leaveDates = approvedLeaveDates(requests, employee.id);
    const demoEmployee = employee.email.startsWith("employee@");

    for (const date of eachDate(start, end)) {
      const day = new Date(`${date}T00:00:00`);
      const weekend = isWeekend(day);
      const onLeave = leaveDates.has(date) && !weekend;
      const status = pickStatus(random, onLeave, date, date === today, demoEmployee);

      let checkIn: string | null = null;
      let checkOut: string | null = null;
      let workingMinutes = 0;

      if (status === "present" || status === "late") {
        const lateBias = status === "late" ? 20 + Math.floor(random() * 25) : Math.floor(random() * 12);
        const inHour = 8;
        const inMinute = 48 + lateBias;
        const normalizedHour = inHour + Math.floor(inMinute / 60);
        const normalizedMinute = inMinute % 60;
        checkIn = `${String(normalizedHour).padStart(2, "0")}:${String(normalizedMinute).padStart(2, "0")}`;
        if (date !== today) {
          const outMinute = 17 * 60 + 45 + Math.floor(random() * 40);
          checkOut = `${String(Math.floor(outMinute / 60)).padStart(2, "0")}:${String(outMinute % 60).padStart(2, "0")}`;
          workingMinutes = minutesBetween(checkIn, checkOut);
        } else if (!demoEmployee) {
          checkOut = null;
          workingMinutes = 0;
        }
      }

      records.push({
        id: `att-${employee.id}-${date}`,
        companyId: employee.companyId,
        employeeId: employee.id,
        date,
        status: date === today && demoEmployee ? "absent" : status,
        checkIn: date === today && demoEmployee ? null : checkIn,
        checkOut: date === today && demoEmployee ? null : checkOut,
        workingMinutes: date === today && demoEmployee ? 0 : workingMinutes,
      });
    }
  }

  return records;
}

function buildAnnouncements(): Announcement[] {
  return [
    {
      id: "ann-acme-1",
      companyId: "company-acme",
      title: "Q4 planning week starts Monday",
      body: "Engineering, product, and design will run a joint planning week. Please keep Tuesday and Thursday mornings free for department reviews. Submit initiative briefs in the planning workspace by Friday.",
      authorId: "acme-priya",
      publishedAt: "2026-10-13T15:00:00.000Z",
    },
    {
      id: "ann-acme-2",
      companyId: "company-acme",
      title: "Office closed on Thanksgiving",
      body: "Acme offices and on-call rotations follow the US holiday calendar. Thanksgiving Day is an observed holiday. If you are on an incident rotation, swap coverage in the on-call board this week.",
      authorId: "acme-priya",
      publishedAt: "2026-10-08T18:20:00.000Z",
    },
    {
      id: "ann-acme-3",
      companyId: "company-acme",
      title: "Benefits enrollment reminder",
      body: "Open enrollment closes on October 31. Review medical, dental, and FSA elections in Workday. People Operations is hosting drop-in sessions in the Austin office on Wednesday at 2:00 PM.",
      authorId: "acme-claire",
      publishedAt: "2026-10-02T12:10:00.000Z",
    },
    {
      id: "ann-acme-4",
      companyId: "company-acme",
      title: "New visitor badge process",
      body: "Starting next week, all guests must be pre-registered in the lobby app. Hosts will receive a QR pass by email. Same-day walk-ins will be delayed at reception.",
      authorId: "acme-priya",
      publishedAt: "2026-09-24T16:40:00.000Z",
    },
    {
      id: "ann-bright-1",
      companyId: "company-bright",
      title: "Client workshop in Chicago next Thursday",
      body: "Consulting and delivery teams supporting Northwind should plan to be on-site at the Michigan Avenue office. Travel desks can book the 7:10 AM block if you are flying in.",
      authorId: "bright-daniel",
      publishedAt: "2026-10-14T13:30:00.000Z",
    },
    {
      id: "ann-bright-2",
      companyId: "company-bright",
      title: "Updated time-entry policy",
      body: "Billable hours must be submitted by 5:00 PM every Friday. Unsubmitted time after the cutoff will not appear in the weekly client invoice pack. Reach out to Operations if a client code is missing.",
      authorId: "bright-grace",
      publishedAt: "2026-10-09T10:05:00.000Z",
    },
    {
      id: "ann-bright-3",
      companyId: "company-bright",
      title: "Wellness stipend refresh",
      body: "The annual wellness stipend resets on November 1. Eligible expenses include gym memberships, mental health apps, and commuting credits. Submit receipts through the HR portal.",
      authorId: "bright-daniel",
      publishedAt: "2026-10-01T15:50:00.000Z",
    },
    {
      id: "ann-bright-4",
      companyId: "company-bright",
      title: "Security training due this month",
      body: "All client-facing staff must complete the 2026 information security module before October 31. The course takes about 35 minutes and is required for continued system access.",
      authorId: "bright-isabelle",
      publishedAt: "2026-09-22T09:00:00.000Z",
    },
  ];
}

export function createInitialDataset(): DemoDataset {
  const managers = employees.filter((employee) => employee.email.startsWith("manager@") || employee.email.startsWith("owner@"));
  const leaveRequests = buildLeaveRequests(employees, managers);
  const attendance = buildAttendance(employees, leaveRequests);
  const announcements = buildAnnouncements();
  const today = todayISO();
  const { start } = monthRange(new Date().getFullYear(), new Date().getMonth());

  return {
    version: DATASET_VERSION,
    companies,
    settings: companySettings,
    users,
    employees,
    departments,
    attendance,
    leaveBalances: buildLeaveBalances(employees),
    leaveRequests,
    announcements,
    activities: employees.flatMap((employee) => {
      if (!employee.email.startsWith("manager@")) return [];
      return [
        {
          id: `act-${employee.companyId}-1`,
          companyId: employee.companyId,
          message: `${fullName(employee)} published this month's company update.`,
          createdAt: `${start}T15:00:00.000Z`,
        },
        {
          id: `act-${employee.companyId}-2`,
          companyId: employee.companyId,
          message: "Payroll cutoff reminder was sent to all active employees.",
          createdAt: `${today}T08:15:00.000Z`,
        },
      ];
    }),
  };
}
