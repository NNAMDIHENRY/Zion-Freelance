"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createWithdrawalRequestAction } from "@/lib/payments/actions";
import { PAYMENT_LIMITS } from "@/lib/payments/constants";
import { formatMoney } from "@/lib/payments/serialize";

type WithdrawalFormProps = {
  currency: string;
  available: number;
  onSuccess: () => void;
  onClose: () => void;
};

export function WithdrawalForm({ currency, available, onSuccess, onClose }: WithdrawalFormProps) {
  const [amount, setAmount] = React.useState("");
  const [accountName, setAccountName] = React.useState("");
  const [accountNumber, setAccountNumber] = React.useState("");
  const [bankName, setBankName] = React.useState("");
  const [payoutMethod, setPayoutMethod] = React.useState<"bank_transfer" | "mobile_money">(
    "bank_transfer"
  );
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
      const res = await createWithdrawalRequestAction({
        amount: value,
        payoutMethod,
        accountName,
        accountNumber,
        bankName: bankName || undefined
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Withdrawal request submitted");
      onSuccess();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Available: {formatMoney(available, currency)}. Minimum withdrawal{" "}
        {formatMoney(PAYMENT_LIMITS.minWithdrawal, currency)}.
      </p>
      <div className="space-y-2">
        <Label htmlFor="wd-amount">Amount</Label>
        <Input
          id="wd-amount"
          type="number"
          min={PAYMENT_LIMITS.minWithdrawal}
          max={Math.min(PAYMENT_LIMITS.maxWithdrawal, available)}
          step="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <PayoutMethodField payoutMethod={payoutMethod} setPayoutMethod={setPayoutMethod} />
      <AccountFields
        accountName={accountName}
        setAccountName={setAccountName}
        accountNumber={accountNumber}
        setAccountNumber={setAccountNumber}
        bankName={bankName}
        setBankName={setBankName}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Submitting…" : "Request withdrawal"}
        </Button>
      </div>
    </form>
  );
}

function PayoutMethodField({
  payoutMethod,
  setPayoutMethod
}: {
  payoutMethod: "bank_transfer" | "mobile_money";
  setPayoutMethod: (v: "bank_transfer" | "mobile_money") => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="wd-method">Payout method</Label>
      <select
        id="wd-method"
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        value={payoutMethod}
        onChange={(e) => setPayoutMethod(e.target.value as "bank_transfer" | "mobile_money")}
      >
        <option value="bank_transfer">Bank transfer</option>
        <option value="mobile_money">Mobile money</option>
      </select>
    </div>
  );
}

function AccountFields(props: {
  accountName: string;
  setAccountName: (v: string) => void;
  accountNumber: string;
  setAccountNumber: (v: string) => void;
  bankName: string;
  setBankName: (v: string) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="wd-name">Account name</Label>
        <Input
          id="wd-name"
          required
          value={props.accountName}
          onChange={(e) => props.setAccountName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="wd-number">Account number</Label>
        <Input
          id="wd-number"
          required
          value={props.accountNumber}
          onChange={(e) => props.setAccountNumber(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="wd-bank">Bank name (optional)</Label>
        <Input
          id="wd-bank"
          value={props.bankName}
          onChange={(e) => props.setBankName(e.target.value)}
        />
      </div>
    </>
  );
}
