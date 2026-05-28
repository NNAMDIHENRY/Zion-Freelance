"use client";

import { ProposalStatus } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useDashboardModal } from "@/components/dashboard/ui/Modal";
import {
  acceptProposalAction,
  rejectProposalAction,
  reviewProposalAction,
  withdrawProposalAction
} from "@/lib/proposals/actions";
import { cn } from "@/lib/utils";

type ProposalActionsProps = {
  proposalId: string;
  status: ProposalStatus;
  role: "client" | "freelancer";
  layout?: "inline" | "stack";
  showOpenDetail?: boolean;
};

export function ProposalActions({
  proposalId,
  status,
  role,
  layout = "inline",
  showOpenDetail
}: ProposalActionsProps) {
  const router = useRouter();
  const { openModal } = useDashboardModal();
  const [busy, setBusy] = React.useState<string | null>(null);

  const wrap = async (
    key: string,
    fn: () => Promise<{ ok: boolean; error?: string }>,
    successMessage = "Saved"
  ) => {
    setBusy(key);
    try {
      const r = await fn();
      if (!r.ok) {
        toast.error(r.error ?? "Something went wrong");
        return;
      }
      toast.success(successMessage);
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const stack = layout === "stack";

  if (role === "freelancer") {
    const canWithdraw = status === ProposalStatus.PENDING || status === ProposalStatus.REVIEWED;
    if (!canWithdraw) return null;
    return (
      <div className={cn("flex flex-wrap gap-2", stack && "flex-col items-stretch")}>
        {showOpenDetail ? (
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href={`/dashboard/proposals/${proposalId}`}>View</Link>
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-destructive/40 text-destructive hover:bg-destructive/10"
          disabled={!!busy}
          onClick={() =>
            openModal({
              variant: "confirm",
              title: "Withdraw this proposal?",
              description: "Clients will no longer see it. You can submit again later if the project stays open.",
              confirmLabel: "Withdraw",
              onConfirm: async () => {
                const r = await withdrawProposalAction(proposalId);
                if (!r.ok) throw new Error(r.error);
                toast.success("Proposal withdrawn");
                router.refresh();
              }
            })
          }
        >
          Withdraw
        </Button>
      </div>
    );
  }

  const canReview = status === ProposalStatus.PENDING;
  const canDecide =
    status === ProposalStatus.PENDING || status === ProposalStatus.REVIEWED;

  return (
    <div className={cn("flex flex-wrap gap-2", stack && "flex-col items-stretch")}>
      {showOpenDetail ? (
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href={`/dashboard/proposals/${proposalId}`}>Detail</Link>
        </Button>
      ) : null}
      {canReview ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!!busy}
          onClick={() =>
            wrap(
              "review",
              async () => {
                const r = await reviewProposalAction(proposalId);
                return { ok: r.ok, error: r.ok ? undefined : r.error };
              },
              "Marked as reviewed"
            )
          }
        >
          {busy === "review" ? "…" : "Review"}
        </Button>
      ) : null}
      {canDecide ? (
        <>
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={!!busy}
            onClick={() =>
              openModal({
                variant: "confirm",
                title: "Accept this proposal?",
                description:
                  "Other pending proposals will be declined and the project will move to in progress. A contract record will be created for the next workflow steps.",
                confirmLabel: "Accept",
                onConfirm: async () => {
                  const r = await acceptProposalAction(proposalId);
                  if (!r.ok) throw new Error(r.error);
                  toast.success("Proposal accepted");
                  router.push(`/dashboard/contracts/${r.contractId}`);
                }
              })
            }
          >
            Accept
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
            disabled={!!busy}
            onClick={() =>
              openModal({
                variant: "confirm",
                title: "Reject this proposal?",
                description: "The freelancer will be notified by status change in their dashboard.",
                confirmLabel: "Reject",
                onConfirm: async () => {
                  const r = await rejectProposalAction(proposalId);
                  if (!r.ok) throw new Error(r.error);
                  toast.success("Proposal rejected");
                  router.refresh();
                }
              })
            }
          >
            Reject
          </Button>
        </>
      ) : null}
    </div>
  );
}
