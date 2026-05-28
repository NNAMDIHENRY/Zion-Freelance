"use client";

import { ContractStatus, EscrowStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { EscrowFundModal } from "@/components/payments/EscrowFundModal";
import { Button } from "@/components/ui/button";
import { useDashboardModal } from "@/components/dashboard/ui/Modal";
import {
  acceptContractAction,
  approveCompletionAction,
  submitCompletionAction
} from "@/lib/contracts/actions";
import { cn } from "@/lib/utils";

type ContractActionsProps = {
  contractId: string;
  status: ContractStatus;
  viewerRole: "client" | "freelancer";
  escrowStatus: EscrowStatus | null;
  currency?: string;
  escrowRemaining?: number;
  walletAvailable?: number;
  layout?: "inline" | "stack";
};

export function ContractActions({
  contractId,
  status,
  viewerRole,
  escrowStatus,
  currency = "USD",
  escrowRemaining = 0,
  walletAvailable = 0,
  layout = "stack"
}: ContractActionsProps) {
  const router = useRouter();
  const { openModal, closeModal } = useDashboardModal();
  const [busy, setBusy] = React.useState<string | null>(null);

  const wrap = async (
    key: string,
    fn: () => Promise<{ ok: boolean; error?: string }>,
    successMessage: string
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
  const needsFunding =
    escrowStatus === EscrowStatus.AWAITING_FUNDING ||
    escrowStatus === EscrowStatus.PARTIALLY_FUNDED;

  const actions: React.ReactNode[] = [];

  if (viewerRole === "freelancer" && status === ContractStatus.PENDING) {
    actions.push(
      <Button
        key="accept"
        type="button"
        disabled={!!busy}
        onClick={() =>
          openModal({
            variant: "confirm",
            title: "Accept this contract?",
            description:
              "Confirm you agree to the terms, milestones, and delivery expectations. The contract becomes active once you accept.",
            confirmLabel: "Accept contract",
            onConfirm: async () => {
              const r = await acceptContractAction(contractId);
              if (!r.ok) throw new Error(r.error);
              toast.success("Contract accepted");
              router.refresh();
            }
          })
        }
      >
        {busy === "accept" ? "…" : "Accept contract"}
      </Button>
    );
  }

  if (viewerRole === "client" && needsFunding && status !== ContractStatus.COMPLETED) {
    actions.push(
      <Button
        key="fund"
        type="button"
        variant="default"
        disabled={!!busy}
        onClick={() =>
          openModal({
            variant: "form",
            title: "Fund escrow",
            description: "Pay from your wallet or via Flutterwave",
            body: (
              <EscrowFundModal
                contractId={contractId}
                currency={currency}
                remaining={escrowRemaining}
                walletAvailable={walletAvailable}
                onClose={closeModal}
              />
            )
          })
        }
      >
        {busy === "fund" ? "…" : "Fund escrow"}
      </Button>
    );
  }

  if (viewerRole === "freelancer" && status === ContractStatus.ACTIVE) {
    actions.push(
      <Button
        key="complete"
        type="button"
        variant="outline"
        disabled={!!busy}
        onClick={() =>
          wrap(
            "complete",
            () => submitCompletionAction(contractId),
            "Completion submitted for client review"
          )
        }
      >
        {busy === "complete" ? "…" : "Mark work complete"}
      </Button>
    );
  }

  if (viewerRole === "client" && status === ContractStatus.ACTIVE) {
    actions.push(
      <Button
        key="approve-completion"
        type="button"
        disabled={!!busy}
        onClick={() =>
          openModal({
            variant: "confirm",
            title: "Approve and close contract?",
            description:
              "This releases any remaining approved milestone funds and marks the project as completed.",
            confirmLabel: "Approve completion",
            onConfirm: async () => {
              const r = await approveCompletionAction(contractId);
              if (!r.ok) throw new Error(r.error);
              toast.success("Contract completed");
              router.refresh();
            }
          })
        }
      >
        {busy === "approve-completion" ? "…" : "Approve completion"}
      </Button>
    );
  }

  if (!actions.length) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", stack && "flex-col items-stretch")}>{actions}</div>
  );
}
