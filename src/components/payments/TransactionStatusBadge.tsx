import { WithdrawalStatus } from "@prisma/client";

import { cn } from "@/lib/utils";

type TransactionStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "REVERSED"
  | "CANCELLED";

const txStyles: Record<TransactionStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  PROCESSING: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  COMPLETED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  FAILED: "bg-red-500/15 text-red-700 dark:text-red-400",
  REVERSED: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  CANCELLED: "bg-muted text-muted-foreground"
};

const wdStyles: Record<WithdrawalStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  UNDER_REVIEW: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  APPROVED: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  PROCESSING: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  COMPLETED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  REJECTED: "bg-red-500/15 text-red-700 dark:text-red-400",
  CANCELLED: "bg-muted text-muted-foreground"
};

export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        txStyles[status]
      )}
    >
      {status.toLowerCase()}
    </span>
  );
}

export function WithdrawalStatusBadge({ status }: { status: WithdrawalStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        wdStyles[status]
      )}
    >
      {status.toLowerCase()}
    </span>
  );
}
