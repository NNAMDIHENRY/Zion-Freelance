"use client";

import * as React from "react";

import { TransactionStatusBadge } from "@/components/payments/TransactionStatusBadge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/payments/serialize";
import type { SerializedTransaction } from "@/lib/payments/types";

type TransactionDetailModalProps = {
  transaction: SerializedTransaction;
  currency: string;
  onClose: () => void;
};

export function TransactionDetailModal({
  transaction,
  currency,
  onClose
}: TransactionDetailModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold">Transaction details</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <DetailRow label="Reference" value={transaction.reference} mono />
          <DetailRow label="Type" value={transaction.type.replace(/_/g, " ")} />
          <DetailRow label="Amount" value={formatMoney(transaction.amount, currency)} />
          <DetailRow
            label="Status"
            value={<TransactionStatusBadge status={transaction.status} />}
          />
          <DetailRow label="Source" value={transaction.source ?? "—"} />
          <DetailRow label="Description" value={transaction.description ?? "—"} />
          {transaction.contractTitle ? (
            <DetailRow label="Contract" value={transaction.contractTitle} />
          ) : null}
          <DetailRow label="Date" value={new Date(transaction.createdAt).toLocaleString()} />
          {transaction.balanceAfter != null ? (
            <DetailRow
              label="Balance after"
              value={formatMoney(transaction.balanceAfter, currency)}
            />
          ) : null}
        </dl>
        <ModalFooter onClose={onClose} />
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? "break-all text-right font-mono text-xs" : "text-right font-medium"}>
        {value}
      </dd>
    </div>
  );
}

function ModalFooter({ onClose }: { onClose: () => void }) {
  return (
    <div className="mt-6 flex justify-end">
      <Button type="button" onClick={onClose}>
        Close
      </Button>
    </div>
  );
}
