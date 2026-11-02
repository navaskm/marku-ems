"use client";

import { AppShell } from "@/components/layout/app-shell";
import type { ReactNode } from "react";

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  return <AppShell role="employee">{children}</AppShell>;
}
