import { BadgeCheck } from "lucide-react";

import { cn } from "@/lib/utils";

export function VerifiedBadge({
  className,
  label = "Verified"
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:text-sky-300",
        className
      )}
      title={label}
    >
      <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {label}
    </span>
  );
}
