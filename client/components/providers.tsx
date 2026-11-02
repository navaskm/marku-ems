"use client";

import { Toasts } from "@/components/ui/toasts";
import { DemoProvider } from "@/features/auth/demo-context";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <DemoProvider>
      {children}
      <Toasts />
    </DemoProvider>
  );
}
