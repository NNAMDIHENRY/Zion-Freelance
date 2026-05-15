import { ProposalStatus } from "@prisma/client";

import { cn } from "@/lib/utils";

type Milestone = {
  key: string;
  label: string;
  date: Date;
  tone: "default" | "muted" | "success" | "warning";
};

const toneDot: Record<Milestone["tone"], string> = {
  default: "bg-primary",
  muted: "bg-muted-foreground/50",
  success: "bg-emerald-500",
  warning: "bg-sky-500"
};

function buildMilestones(input: {
  createdAt: Date;
  updatedAt: Date;
  withdrawnAt: Date | null;
  status: ProposalStatus;
}): Milestone[] {
  const { createdAt, updatedAt, withdrawnAt, status } = input;
  const items: Milestone[] = [
    { key: "submitted", label: "Submitted", date: createdAt, tone: "default" }
  ];

  if (status === ProposalStatus.WITHDRAWN && withdrawnAt) {
    items.push({ key: "withdrawn", label: "Withdrawn", date: withdrawnAt, tone: "muted" });
    return items.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  if (status === ProposalStatus.REVIEWED) {
    items.push({
      key: "reviewed",
      label: "Marked as reviewed",
      date: updatedAt,
      tone: "warning"
    });
  }

  if (status === ProposalStatus.ACCEPTED) {
    items.push({ key: "accepted", label: "Accepted", date: updatedAt, tone: "success" });
  } else if (status === ProposalStatus.REJECTED) {
    items.push({ key: "rejected", label: "Rejected", date: updatedAt, tone: "muted" });
  }

  return items.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function ProposalTimelineDisplay({
  createdAt,
  updatedAt,
  withdrawnAt,
  status
}: {
  createdAt: Date;
  updatedAt: Date;
  withdrawnAt: Date | null;
  status: ProposalStatus;
}) {
  const milestones = buildMilestones({ createdAt, updatedAt, withdrawnAt, status });

  return (
    <ol className="relative space-y-4 border-l border-border/80 pl-6">
      {milestones.map((m) => (
        <li key={m.key} className="relative">
          <span
            className={cn(
              "absolute -left-[1.35rem] top-1.5 size-2.5 rounded-full ring-4 ring-background",
              toneDot[m.tone]
            )}
          />
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-foreground">{m.label}</p>
            <time className="text-xs tabular-nums text-muted-foreground" dateTime={m.date.toISOString()}>
              {m.date.toLocaleString()}
            </time>
          </div>
        </li>
      ))}
    </ol>
  );
}
