import { ContractStatus } from "@prisma/client";

import { cn } from "@/lib/utils";

type Step = {
  key: string;
  label: string;
  done: boolean;
  active: boolean;
};

function buildSteps(input: {
  status: ContractStatus;
  acceptedAt: string | null;
  completedAt: string | null;
  escrowFunded: boolean;
}): Step[] {
  const { status, acceptedAt, completedAt, escrowFunded } = input;
  const isActive = status === ContractStatus.ACTIVE;
  const isDone = status === ContractStatus.COMPLETED;

  return [
    {
      key: "created",
      label: "Contract created",
      done: true,
      active: status === ContractStatus.PENDING && !acceptedAt
    },
    {
      key: "funded",
      label: "Escrow funded",
      done: escrowFunded,
      active: status === ContractStatus.PENDING && !escrowFunded
    },
    {
      key: "accepted",
      label: "Freelancer accepted",
      done: !!acceptedAt,
      active: status === ContractStatus.PENDING && escrowFunded && !acceptedAt
    },
    {
      key: "active",
      label: "Work in progress",
      done: isDone,
      active: isActive
    },
    {
      key: "completed",
      label: "Contract completed",
      done: isDone,
      active: false
    }
  ].map((s) => ({
    ...s,
    active: s.active && !s.done
  }));
}

export function ContractProgressTimeline({
  status,
  acceptedAt,
  completedAt,
  escrowFunded,
  completionPercent
}: {
  status: ContractStatus;
  acceptedAt: string | null;
  completedAt: string | null;
  escrowFunded: boolean;
  completionPercent: number;
}) {
  const steps = buildSteps({ status, acceptedAt, completedAt, escrowFunded });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Progress
        </h3>
        <span className="text-sm font-medium tabular-nums">{completionPercent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${completionPercent}%` }}
        />
      </div>
      <ol className="relative space-y-4 border-l border-border/80 pl-6">
        {steps.map((step) => (
          <li key={step.key} className="relative">
            <span
              className={cn(
                "absolute -left-[1.35rem] top-1.5 size-2.5 rounded-full ring-4 ring-background",
                step.done
                  ? "bg-emerald-500"
                  : step.active
                    ? "bg-primary"
                    : "bg-muted-foreground/40"
              )}
            />
            <p
              className={cn(
                "text-sm font-medium",
                step.done || step.active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {step.label}
            </p>
            {step.key === "completed" && completedAt ? (
              <time className="text-xs text-muted-foreground" dateTime={completedAt}>
                {new Date(completedAt).toLocaleString()}
              </time>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
