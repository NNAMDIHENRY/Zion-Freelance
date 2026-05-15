import { ProposalStatus } from "@prisma/client";

import { statusLabel } from "@/lib/projects/formatting";
import { cn } from "@/lib/utils";

const styles: Record<ProposalStatus, string> = {
  [ProposalStatus.PENDING]: "bg-amber-500/15 text-amber-900 dark:text-amber-100 border-amber-500/30",
  [ProposalStatus.REVIEWED]: "bg-sky-500/15 text-sky-900 dark:text-sky-100 border-sky-500/30",
  [ProposalStatus.ACCEPTED]: "bg-emerald-500/15 text-emerald-900 dark:text-emerald-100 border-emerald-500/30",
  [ProposalStatus.REJECTED]: "bg-destructive/10 text-destructive border-destructive/25",
  [ProposalStatus.WITHDRAWN]: "bg-muted text-muted-foreground border-border"
};

export function ProposalStatusBadge({
  status,
  className
}: {
  status: ProposalStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide",
        styles[status],
        className
      )}
    >
      {statusLabel(status)}
    </span>
  );
}
