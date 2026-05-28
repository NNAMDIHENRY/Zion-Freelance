"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createWalletFundingSessionAction } from "@/lib/payments/actions";
import { PAYMENT_LIMITS } from "@/lib/payments/constants";

type FundingModalProps = {
  currency: string;
  onClose: () => void;
};

export function FundingModal({ currency, onClose }: FundingModalProps) {
  const [amount, setAmount] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value)) {
      toast.error("Enter a valid amount");
      return;
    }
    setBusy(true);
    try {
      const res = await createWalletFundingSessionAction({ amount: value });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      window.location.href = res.checkoutUrl;
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        You will be redirected to Flutterwave to complete a secure deposit into your {currency}{" "}
        wallet. Limits: {PAYMENT_LIMITS.minWalletFund}–
        {PAYMENT_LIMITS.maxWalletFund.toLocaleString()}.
      </p>
      <div className="space-y-2">
        <Label htmlFor="fund-amount">Amount</Label>
        <Input
          id="fund-amount"
          type="number"
          min={PAYMENT_LIMITS.minWalletFund}
          max={PAYMENT_LIMITS.maxWalletFund}
          step="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g. 100"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Starting…" : "Continue to payment"}
        </Button>
      </div>
    </form>
  );
}
