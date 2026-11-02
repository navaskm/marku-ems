"use client";

import { AppShell } from "@/components/layout/app-shell";
import type { ReactNode } from "react";

export default function ManagerLayout({ children }: { children: ReactNode }) {
  return <AppShell role="manager">{children}</AppShell>;
}
