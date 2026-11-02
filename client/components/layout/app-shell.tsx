"use client";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useCompanyData, useDemo } from "@/features/auth/demo-context";
import { cn } from "@/lib/cn";
import { fullName } from "@/lib/names";
import type { Role } from "@/types";
import {
  Building2,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";

const employeeLinks = [
  { href: "/employee", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employee/attendance", label: "My Attendance", icon: CalendarDays },
  { href: "/employee/profile", label: "My Profile", icon: Users },
];

const managerLinks = [
  { href: "/manager/employees", label: "Employees", icon: Users },
  { href: "/manager/attendance", label: "Attendance", icon: CalendarDays },
  { href: "/manager/departments", label: "Departments", icon: Building2 },
  { href: "/manager/settings", label: "Settings", icon: Settings },
];

export function AppShell({ role, children }: { role: Role; children: ReactNode }) {
  return (
    <Suspense fallback={<Spinner />}>
      <AppShellContent role={role}>{children}</AppShellContent>
    </Suspense>
  );
}

function AppShellContent({ role, children }: { role: Role; children: ReactNode }) {
  const { ready, session, logout } = useDemo();
  const { company, currentEmployee } = useCompanyData();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (session.role !== role) {
      router.replace(session.role === "manager" ? "/manager/employees" : "/employee/attendance");
    }
  }, [ready, role, router, session]);

  if (!ready || !session || session.role !== role || !currentEmployee || !company) {
    return <Spinner />;
  }

  const links = role === "manager" ? managerLinks : employeeLinks;
  const home = role === "manager" ? "/manager" : "/employee";
  const isActive = (href: string) => pathname === href || (href !== home && pathname.startsWith(`${href}/`));

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {links.map((link) => {
        const active = isActive(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
              active ? "bg-brand-light text-primary-hover shadow-sm" : "text-muted hover:bg-brand-soft hover:text-primary-hover",
            )}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );

  const mobileNav = (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-soft bg-brand-light/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-4px_20px_rgba(14,143,132,0.12)] backdrop-blur lg:hidden" aria-label="Mobile navigation">
      <div className="mx-auto flex max-w-lg items-stretch justify-around gap-1">
        {links.map((link) => {
          const active = isActive(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium transition",
                active ? "bg-primary text-white shadow-sm" : "text-muted hover:bg-brand-soft hover:text-primary-hover",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-page">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-brand-soft bg-brand-light lg:flex">
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <Image src="/MarkU-Logo.png" alt="MarkU logo" width={38} height={38} className="h-9 w-9 rounded-lg object-contain" priority />
            <div>
              <p className="text-sm font-semibold text-brand-text">Workline</p>
              <p className="text-xs text-muted">{company.name}</p>
            </div>
          </div>
        </div>
        {nav}

      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-brand-soft bg-brand-light/90 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-medium text-brand-text">{company.name}</p>
              <p className="text-xs text-muted">Workspace {company.code}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone="green">{role === "manager" ? "Manager" : "Employee"}</Badge>
            <div className="hidden items-center gap-2 sm:flex">
              <Avatar employee={currentEmployee} size="sm" />
              <div className="leading-tight">
                <p className="text-sm font-medium text-slate-800">{fullName(currentEmployee)}</p>
                <p className="text-xs text-slate-500">{currentEmployee.jobTitle}</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              className="gap-2 border-slate-200 bg-transparent text-[#4F5053] shadow-none transition-all duration-200 hover:border-slate-300 hover:bg-slate-100 hover:text-[#0E8F84]"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>

          </div>
        </header>
        <main className="px-4 py-6 pb-24 sm:px-6 lg:pb-6">{children}</main>
      </div>

      {mobileNav}


    </div>
  );
}
