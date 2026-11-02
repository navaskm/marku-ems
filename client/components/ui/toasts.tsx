"use client";

import { useDemo } from "@/features/auth/demo-context";
import { cn } from "@/lib/cn";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

export function Toasts() {
  const { toasts, dismissToast } = useDemo();

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[min(100%-2rem,22rem)] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto flex items-start gap-3 rounded-xl border border-brand-soft bg-surface px-3 py-3 shadow-lg",
            toast.type === "error" && "border-rose-100",
            toast.type === "success" && "border-emerald-100",
            toast.type === "info" && "border-slate-200",
          )}
        >
          {toast.type === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> : null}
          {toast.type === "error" ? <XCircle className="mt-0.5 h-4 w-4 text-rose-600" /> : null}
          {toast.type === "info" ? <Info className="mt-0.5 h-4 w-4 text-indigo-600" /> : null}
          <p className="flex-1 text-sm text-slate-700">{toast.message}</p>
          <button className="text-muted hover:text-primary-hover" onClick={() => dismissToast(toast.id)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
