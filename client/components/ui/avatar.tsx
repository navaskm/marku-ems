import { cn } from "@/lib/cn";
import { initials } from "@/lib/names";
import type { Employee } from "@/types";

export function Avatar({
  employee,
  size = "md",
}: {
  employee: Pick<Employee, "firstName" | "lastName" | "avatarHue">;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizes = {
    sm: "h-8 w-8 text-[10px]",
    md: "h-10 w-10 text-xs",
    lg: "h-12 w-12 text-sm",
    xl: "h-20 w-20 text-xl",
  };

  return (
    <div
      className={cn("flex items-center justify-center rounded-full font-semibold text-white", sizes[size])}
      style={{ backgroundColor: `hsl(${employee.avatarHue} 62% 42%)` }}
    >
      {initials(employee)}
    </div>
  );
}
