"use client";

import { ContractStatus, DisputeStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { openDisputeAction } from "@/lib/contracts/dispute-actions";

type DisputeLite = {
  id: string;
  status: DisputeStatus;
  reason: string;
  resolution: string | null;
  createdAt: string;
  openedByName: string;
} | null;

export function OpenDisputePanel({
  contractId,
  contractStatus,
  dispute
}: {
  contractId: string;
  contractStatus: ContractStatus;
  dispute: DisputeLite;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [pending, setPending] = React.useState(false);

  if (contractStatus === ContractStatus.COMPLETED || contractStatus === ContractStatus.TERMINATED) {
    return null;
  }

  if (dispute) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
        <p className="font-semibold text-amber-800 dark:text-amber-200">
          Dispute · {dispute.status.replace(/_/g, " ")}
        </p>
        <p className="mt-2 text-muted-foreground">{dispute.reason}</p>
        {dispute.resolution ? (
          <p className="mt-2 text-foreground">Resolution: {dispute.resolution}</p>
        ) : null}
        <p className="mt-2 text-xs text-muted-foreground">
          Opened by {dispute.openedByName} · {new Date(dispute.createdAt).toLocaleString()}
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Open dispute
      </Button>
    );
  }

  return (
    <form
      className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        setPending(true);
        void openDisputeAction(contractId, reason).then((res) => {
          setPending(false);
          if (!res.ok) {
            toast.error(res.error);
            return;
          }
          toast.success("Dispute opened");
          setOpen(false);
          router.refresh();
        });
      }}
    >
      <p className="text-sm font-semibold">Open a dispute</p>
      <Textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Describe the issue (payment, deliverables, communication…)"
        rows={4}
        minLength={20}
        required
      />
      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          disabled={pending}
        >
          {pending ? "Submitting…" : "Submit dispute"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
