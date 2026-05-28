"use client";

import { ContractStatus, MilestoneStatus } from "@prisma/client";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ContractMilestoneDTO } from "@/components/contracts/types";
import { addMilestoneAction } from "@/lib/contracts/actions";

export function MilestoneAddForm({
  contractId,
  contractStatus,
  agreedAmount,
  currency,
  milestones,
  escrowFunded
}: {
  contractId: string;
  contractStatus: ContractStatus;
  agreedAmount: number;
  currency: string;
  milestones: ContractMilestoneDTO[];
  escrowFunded: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");

  const editable =
    contractStatus === ContractStatus.PENDING &&
    !escrowFunded &&
    milestones.every((m) => m.status === MilestoneStatus.PENDING);

  if (!editable) return null;

  const currentTotal = milestones.reduce((s, m) => s + Number(m.amount), 0);
  const remaining = agreedAmount - currentTotal;

  if (remaining <= 0.01) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await addMilestoneAction(contractId, {
      title: title.trim(),
      description: description.trim() || undefined,
      amount: Number(amount),
      dueDate: dueDate ? new Date(dueDate) : null
    });
    setPending(false);
    if (!res.ok) {
      toast.error(res.error ?? "Could not add milestone");
      return;
    }
    toast.success("Milestone added");
    setOpen(false);
    setTitle("");
    setDescription("");
    setAmount("");
    setDueDate("");
    router.refresh();
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" className="mb-4" onClick={() => setOpen(true)}>
        <Plus className="mr-1 h-4 w-4" />
        Add milestone ({remaining.toFixed(2)} {currency} remaining)
      </Button>
    );
  }

  return (
    <form
      className="mb-4 space-y-3 rounded-xl border border-sky-200/60 bg-sky-50/50 p-4 dark:border-sky-900/40 dark:bg-sky-950/20"
      onSubmit={(e) => void submit(e)}
    >
      <div className="space-y-1">
        <Label htmlFor="ms-title">Title</Label>
        <Input id="ms-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="ms-desc">Description</Label>
        <Textarea id="ms-desc" value={description} rows={2} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="ms-amount">Amount ({currency})</Label>
          <Input
            id="ms-amount"
            type="number"
            min={0.01}
            max={remaining}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="ms-due">Due date</Label>
          <Input id="ms-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Adding…" : "Add milestone"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
