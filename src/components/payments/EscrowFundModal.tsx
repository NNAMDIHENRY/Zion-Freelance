"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fundEscrowAction } from "@/lib/contracts/actions";
import { formatMoney } from "@/lib/payments/serialize";

type EscrowFundModalProps = {
  contractId: string;
  currency: string;
  remaining: number;
  walletAvailable: number;
  onClose: () => void;
};

export function EscrowFundModal({
  contractId,
  currency,
  remaining,
  walletAvailable,
  onClose
}: EscrowFundModalProps) {
  const router = useRouter();
  const [amount, setAmount] = React.useState(String(remaining));
  const [method, setMethod] = React.useState<"wallet" | "flutterwave">("wallet");
  const [busy, setBusy] = React.useState(false);

  const fund = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setBusy(true);
    try {
      const res = await fundEscrowAction(contractId, { method, amount: value });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
        return;
      }
      toast.success("Escrow funded from wallet");
      router.refresh();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Remaining to fund: {formatMoney(remaining, currency)}. Wallet available:{" "}
        {formatMoney(walletAvailable, currency)}.
      </p>
      <div className="space-y-2">
        <Label htmlFor="escrow-amount">Amount</Label>
        <Input
          id="escrow-amount"
          type="number"
          min={0.01}
          max={remaining}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="escrow-method">Payment method</Label>
        <select
          id="escrow-method"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={method}
          onChange={(e) => setMethod(e.target.value as "wallet" | "flutterwave")}
        >
          <option value="wallet">Wallet balance</option>
          <option value="flutterwave">Flutterwave (card / bank)</option>
        </select>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button type="button" onClick={() => void fund()} disabled={busy}>
          {busy ? "Processing…" : "Fund escrow"}
        </Button>
      </div>
    </div>
  );
}
