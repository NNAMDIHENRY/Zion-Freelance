"use client";

import { ContractStatus, MilestoneStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ContractMilestoneDTO } from "@/components/contracts/types";
import {
  approveMilestoneAction,
  releaseMilestoneAction,
  submitMilestoneAction
} from "@/lib/contracts/actions";
import { milestoneStatusLabel } from "@/lib/contracts/milestone-labels";
import { moneyLabel } from "@/lib/projects/formatting";
import { cn } from "@/lib/utils";

const statusTone: Record<MilestoneStatus, string> = {
  [MilestoneStatus.PENDING]: "text-muted-foreground",
  [MilestoneStatus.FUNDED]: "text-sky-700 dark:text-sky-300",
  [MilestoneStatus.ACTIVE]: "text-primary",
  [MilestoneStatus.SUBMITTED]: "text-amber-700 dark:text-amber-300",
  [MilestoneStatus.APPROVED]: "text-emerald-700 dark:text-emerald-300",
  [MilestoneStatus.RELEASED]: "text-emerald-800 dark:text-emerald-200"
};

type MilestoneManagerProps = {
  contractId: string;
  contractStatus: ContractStatus;
  viewerRole: "client" | "freelancer";
  milestones: ContractMilestoneDTO[];
};

export function MilestoneManager({
  contractId,
  contractStatus,
  viewerRole,
  milestones
}: MilestoneManagerProps) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) => {
    setBusy(key);
    try {
      const r = await fn();
      if (!r.ok) {
        toast.error(r.error ?? "Something went wrong");
        return;
      }
      toast.success(msg);
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  if (!milestones.length) {
    return <p className="text-sm text-muted-foreground">No milestones configured yet.</p>;
  }

  return (
    <ul className="space-y-4">
      {milestones.map((m) => {
        const canSubmit =
          viewerRole === "freelancer" &&
          contractStatus === ContractStatus.ACTIVE &&
          m.status === MilestoneStatus.ACTIVE;
        const canApprove =
          viewerRole === "client" &&
          contractStatus === ContractStatus.ACTIVE &&
          m.status === MilestoneStatus.SUBMITTED;
        const canRelease =
          viewerRole === "client" &&
          contractStatus === ContractStatus.ACTIVE &&
          m.status === MilestoneStatus.APPROVED;

        return (
          <li
            key={m.id}
            className="rounded-xl border border-border/60 bg-muted/5 p-4 space-y-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-foreground">{m.title}</p>
                {m.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
                ) : null}
              </div>
              <span className={cn("text-xs font-medium uppercase", statusTone[m.status])}>
                {milestoneStatusLabel(m.status)}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="tabular-nums font-medium text-foreground">
                {moneyLabel(m.amount, m.currency)}
              </span>
              {m.dueDate ? (
                <span>Due {new Date(m.dueDate).toLocaleDateString()}</span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {canSubmit ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={!!busy}
                  onClick={() =>
                    run(
                      `submit-${m.id}`,
                      () => submitMilestoneAction(contractId, m.id),
                      "Work submitted"
                    )
                  }
                >
                  {busy === `submit-${m.id}` ? "…" : "Submit work"}
                </Button>
              ) : null}
              {canApprove ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={!!busy}
                  onClick={() =>
                    run(
                      `approve-${m.id}`,
                      () => approveMilestoneAction(contractId, m.id),
                      "Milestone approved"
                    )
                  }
                >
                  {busy === `approve-${m.id}` ? "…" : "Approve"}
                </Button>
              ) : null}
              {canRelease ? (
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  disabled={!!busy}
                  onClick={() =>
                    run(
                      `release-${m.id}`,
                      () => releaseMilestoneAction(contractId, m.id),
                      "Funds released"
                    )
                  }
                >
                  {busy === `release-${m.id}` ? "…" : "Release funds"}
                </Button>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
