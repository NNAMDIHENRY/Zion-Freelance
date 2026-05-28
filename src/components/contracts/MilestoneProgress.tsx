import { MilestoneStatus } from "@prisma/client";

import type { ContractMilestoneDTO } from "@/components/contracts/types";
import { milestoneStatusLabel } from "@/lib/contracts/milestone-labels";
import { cn } from "@/lib/utils";

const DONE: MilestoneStatus[] = [MilestoneStatus.APPROVED, MilestoneStatus.RELEASED];

type MilestoneProgressProps = {
  milestones: ContractMilestoneDTO[];
  completionPercent: number;
};

export function MilestoneProgress({ milestones, completionPercent }: MilestoneProgressProps) {
  if (!milestones.length) return null;

  const paid = milestones.filter((m) => m.status === MilestoneStatus.RELEASED).length;

  return (
    <div className="mb-6 space-y-3" aria-label="Milestone progress">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-medium text-foreground">Progress</span>
        <span className="text-muted-foreground tabular-nums">
          {paid}/{milestones.length} paid · {completionPercent}%
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={completionPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Contract ${completionPercent}% complete`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-violet-600 transition-all duration-500"
          style={{ width: `${completionPercent}%` }}
        />
      </div>
      <ol className="flex flex-wrap gap-2">
        {milestones.map((m, i) => {
          const done = DONE.includes(m.status);
          return (
            <li
              key={m.id}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                done
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                  : "border-border/70 bg-muted/30 text-muted-foreground"
              )}
              title={milestoneStatusLabel(m.status)}
            >
              {i + 1}. {m.title}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
