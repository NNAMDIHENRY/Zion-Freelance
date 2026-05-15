import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

type Trend = "up" | "down" | "neutral";

export type StatCardProps = {
  title: string;
  value: string;
  description?: string;
  trend?: Trend;
  trendLabel?: string;
  className?: string;
};

export function StatCard({
  title,
  value,
  description,
  trend,
  trendLabel,
  className
}: StatCardProps) {
  const TrendIcon = trend === "down" ? ArrowDownRight : ArrowUpRight;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-5 shadow-subtle",
        className
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {trend && trend !== "neutral" && trendLabel ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
              trend === "up" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
              trend === "down" && "bg-rose-500/10 text-rose-700 dark:text-rose-400"
            )}
          >
            <TrendIcon className="h-3.5 w-3.5" aria-hidden />
            {trendLabel}
          </span>
        ) : null}
      </div>
      {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}
