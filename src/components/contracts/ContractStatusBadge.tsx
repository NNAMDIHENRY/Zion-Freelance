import { ContractStatus } from "@prisma/client";

import { cn } from "@/lib/utils";
import { statusLabel } from "@/lib/projects/formatting";

const tones: Record<ContractStatus, string> = {
  [ContractStatus.PENDING]: "bg-amber-500/15 text-amber-900 dark:text-amber-100 border-amber-500/30",
  [ContractStatus.ACTIVE]: "bg-sky-500/15 text-sky-900 dark:text-sky-100 border-sky-500/30",
  [ContractStatus.COMPLETED]: "bg-emerald-500/15 text-emerald-900 dark:text-emerald-100 border-emerald-500/30",
  [ContractStatus.TERMINATED]: "bg-muted text-muted-foreground border-border",
  [ContractStatus.DISPUTED]: "bg-destructive/15 text-destructive border-destructive/30"
};

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[status]
      )}
    >
      {statusLabel(status)}
    </span>
  );
}
