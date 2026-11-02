import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "indigo",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: "indigo" | "green" | "amber" | "rose" | "sky";
}) {
  const tones = {
  indigo: "bg-brand-light text-primary-hover",
  green: "bg-brand-light text-primary-hover",
    amber: "bg-brand-soft text-primary-hover",
    rose: "bg-brand-light text-primary-hover",
  sky: "bg-[#eef7f6] text-primary-hover",
  };

  return (
    <div className="min-w-0 rounded-lg border border-border bg-surface p-2 shadow-sm sm:p-4">
      <div className="flex flex-col-reverse items-start gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0 w-full">
          <div className="flex items-center justify-between gap-1 sm:block">
            <p className="min-w-0 text-[9px] font-medium uppercase tracking-wide text-slate-500 sm:text-xs">
              {label}
            </p>

            <p className="shrink-0 text-lg font-semibold text-slate-900 sm:mt-2 sm:text-2xl">
              {value}
            </p>
          </div>

          {hint ? (
            <p className="mt-1 text-[9px] leading-tight text-slate-500 sm:text-xs">
              {hint}
            </p>
          ) : null}
        </div>

        <div className={cn("rounded-md p-1.5 sm:rounded-lg sm:p-2", tones[tone])}>
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </div>
      </div>
    </div>
  );
}
