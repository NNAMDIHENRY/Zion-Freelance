"use client";

import { WithdrawalStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { adminWithdrawalActionAction } from "@/lib/admin/actions";

type Row = {
  id: string;
  amount: string;
  currency: string;
  status: WithdrawalStatus;
  flaggedForReview: boolean;
  payoutMethod: string;
  requesterName: string;
  requesterEmail: string;
  walletBalance: string;
  priorWithdrawals: number;
  createdAt: string;
  reviewNote: string | null;
};

export function WithdrawalApprovalTable({ items }: { items: Row[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function act(
    withdrawalId: string,
    action: "approve" | "reject" | "review" | "unflag"
  ) {
    startTransition(async () => {
      const res = await adminWithdrawalActionAction({ withdrawalId, action });
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Withdrawal updated");
        router.refresh();
      }
    });
  }

  if (!items.length) {
    return (
      <p className="rounded-2xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
        No withdrawal requests in queue.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((w) => {
        const terminal =
          w.status === WithdrawalStatus.COMPLETED ||
          w.status === WithdrawalStatus.REJECTED ||
          w.status === WithdrawalStatus.CANCELLED;
        return (
          <li
            key={w.id}
            className="rounded-2xl border border-border/60 bg-card p-4 shadow-subtle"
          >
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-medium">
                  {w.amount} {w.currency} — {w.requesterName}
                </p>
                <p className="text-xs text-muted-foreground">{w.requesterEmail}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Wallet: {w.walletBalance} · Prior withdrawals: {w.priorWithdrawals} ·{" "}
                  {w.payoutMethod}
                </p>
              </div>
              <div className="text-right text-xs">
                <span className="rounded-full bg-muted px-2 py-0.5 font-medium">{w.status}</span>
                {w.flaggedForReview ? (
                  <p className="mt-1 text-amber-600">Flagged for review</p>
                ) : null}
              </div>
            </div>
            {!terminal ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" disabled={pending} onClick={() => act(w.id, "approve")}>
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  disabled={pending}
                  onClick={() => act(w.id, "reject")}
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => act(w.id, "review")}
                >
                  Flag review
                </Button>
                {w.flaggedForReview ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => act(w.id, "unflag")}
                  >
                    Unflag
                  </Button>
                ) : null}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
