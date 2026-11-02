import { cn } from "@/lib/cn";
import type { AttendanceStatus, EmployeeStatus, LeaveStatus } from "@/types";

const tones = {
  slate: "bg-brand-soft text-brand-text",
  green: "bg-brand-light text-primary-hover",
  amber: "bg-brand-soft text-primary-hover",
  red: "bg-brand-light text-primary-hover",
  indigo: "bg-brand-light text-primary-hover",
  blue: "bg-brand-soft text-primary-hover",
};

export function Badge({
  children,
  tone = "slate",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

export function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  const map: Record<AttendanceStatus, { label: string; tone: keyof typeof tones }> = {
    present: { label: "Present", tone: "green" },
    late: { label: "Late", tone: "amber" },
    absent: { label: "Absent", tone: "red" },
    holiday: { label: "Holiday", tone: "slate" },
    leave: { label: "Leave", tone: "blue" },
  };
  const item = map[status];
  return <Badge tone={item.tone}>{item.label}</Badge>;
}

export function LeaveBadge({ status }: { status: LeaveStatus }) {
  const map: Record<LeaveStatus, { label: string; tone: keyof typeof tones }> = {
    pending: { label: "Pending", tone: "amber" },
    approved: { label: "Approved", tone: "green" },
    rejected: { label: "Rejected", tone: "red" },
    cancelled: { label: "Cancelled", tone: "slate" },
  };
  const item = map[status];
  return <Badge tone={item.tone}>{item.label}</Badge>;
}

export function StatusBadge({ status }: { status: EmployeeStatus }) {
  return <Badge tone={status === "active" ? "green" : "slate"}>{status === "active" ? "Active" : "Inactive"}</Badge>;
}
