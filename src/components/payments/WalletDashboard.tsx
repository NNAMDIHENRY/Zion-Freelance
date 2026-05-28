"use client";

import * as React from "react";
import { Role, TransactionType } from "@prisma/client";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { FundingModal } from "@/components/payments/FundingModal";
import { TransactionTable } from "@/components/payments/TransactionTable";
import { WithdrawalForm } from "@/components/payments/WithdrawalForm";
import { WithdrawalStatusBadge } from "@/components/payments/TransactionStatusBadge";
import { useDashboardModal } from "@/components/dashboard/ui/Modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/payments/serialize";
import type { SerializedTransaction, SerializedWithdrawal, WalletBalanceSnapshot } from "@/lib/payments/types";

type WalletDashboardProps = {
  role: Role;
  title: string;
  description: string;
  currency: string;
  snapshot: WalletBalanceSnapshot;
  transactions: SerializedTransaction[];
  withdrawals: SerializedWithdrawal[];
  transactionTotal: number;
};

const CLIENT_TYPES: TransactionType[] = [
  TransactionType.DEPOSIT,
  TransactionType.PAYMENT,
  TransactionType.ESCROW_HOLD,
  TransactionType.ESCROW_REFUND,
  TransactionType.FEE
];

const FREELANCER_TYPES: TransactionType[] = [
  TransactionType.ESCROW_RELEASE,
  TransactionType.DEPOSIT,
  TransactionType.WITHDRAWAL,
  TransactionType.FEE
];

export function WalletDashboard({
  role,
  title,
  description,
  currency,
  snapshot,
  transactions,
  withdrawals,
  transactionTotal
}: WalletDashboardProps) {
  const { openModal, closeModal } = useDashboardModal();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    const payment = searchParams.get("payment");
    const message = searchParams.get("message");
    if (payment === "success") toast.success("Payment confirmed");
    if (payment === "failed") toast.error(message ?? "Payment failed");
    if (payment === "error") toast.error(message ?? "Payment error");
  }, [searchParams]);

  const roleTypes = role === Role.CLIENT ? CLIENT_TYPES : FREELANCER_TYPES;

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BalanceCard label="Available" value={formatMoney(snapshot.available, currency)} />
        <BalanceCard label="Locked in escrow" value={formatMoney(snapshot.locked, currency)} />
        <BalanceCard label="Pending" value={formatMoney(snapshot.pending, currency)} />
        <BalanceCard label="Withdrawn" value={formatMoney(snapshot.withdrawn, currency)} />
      </div>

      <div className="flex flex-wrap gap-2">
        {role === Role.CLIENT ? (
          <Button
            type="button"
            onClick={() =>
              openModal({
                variant: "form",
                title: "Fund wallet",
                description: "Add funds via Flutterwave",
                body: <FundingModal currency={currency} onClose={closeModal} />
              })
            }
          >
            Fund wallet
          </Button>
        ) : null}
        {role === Role.FREELANCER ? (
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              openModal({
                variant: "form",
                title: "Withdraw funds",
                description: "Request a payout to your bank account",
                body: (
                  <WithdrawalForm
                    currency={currency}
                    available={snapshot.available}
                    onClose={closeModal}
                    onSuccess={() => window.location.reload()}
                  />
                )
              })
            }
          >
            Request withdrawal
          </Button>
        ) : null}
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Recent transactions</h2>
        <TransactionTable
          currency={currency}
          initialRows={transactions}
          initialTotal={transactionTotal}
          roleFilterTypes={roleTypes}
        />
      </section>

      {role === Role.FREELANCER && withdrawals.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Withdrawal requests</h2>
          <div className="overflow-x-auto rounded-2xl border border-border/80">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Requested</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">
                      {formatMoney(w.amount, w.currency)}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {w.payoutMethod.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3">
                      <WithdrawalStatusBadge status={w.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(w.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function BalanceCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0" />
    </Card>
  );
}
