import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function FormAlert({
  variant,
  children,
  className
}: {
  variant: "error" | "success";
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        variant === "error" &&
          "border-destructive/30 bg-destructive/5 text-destructive",
        variant === "success" &&
          "border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-200",
        className
      )}
    >
      {children}
    </div>
  );
}
