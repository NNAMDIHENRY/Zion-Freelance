"use client";

import { ContractStatus } from "@prisma/client";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { setupMilestonesAction } from "@/lib/contracts/actions";

type Draft = { title: string; description: string; amount: string; dueDate: string };

export function MilestoneSetupPanel({
  contractId,
  contractStatus,
  viewerRole,
  agreedAmount,
  currency,
  hasMilestones
}: {
  contractId: string;
  contractStatus: ContractStatus;
  viewerRole: "client" | "freelancer";
  agreedAmount: number;
  currency: string;
  hasMilestones: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = React.useState<Draft[]>([
    { title: "Milestone 1", description: "", amount: String(agreedAmount), dueDate: "" }
  ]);
  const [pending, setPending] = React.useState(false);

  if (contractStatus !== ContractStatus.PENDING || hasMilestones) {
    return null;
  }

  function addRow() {
    setRows((r) => [...r, { title: `Milestone ${r.length + 1}`, description: "", amount: "", dueDate: "" }]);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const milestones = rows.map((r) => ({
      title: r.title.trim(),
      description: r.description.trim() || undefined,
      amount: Number(r.amount),
      dueDate: r.dueDate ? new Date(r.dueDate) : null
    }));
    const res = await setupMilestonesAction(contractId, { milestones });
    setPending(false);
    if (!res.ok) {
      toast.error(res.error ?? "Could not save milestones");
      return;
    }
    toast.success("Milestones configured");
    router.refresh();
  }

  const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  return (
    <form className="mb-6 space-y-4 rounded-xl border border-dashed border-violet-500/40 bg-violet-500/5 p-4" onSubmit={(e) => void save(e)}>
      <div>
        <h3 className="text-sm font-semibold">Configure milestones</h3>
        <p className="text-xs text-muted-foreground">
          Split the contract total ({agreedAmount} {currency}) into funded milestones before work begins.
        </p>
      </div>
      {rows.map((row, i) => (
        <div key={i} className="grid gap-3 rounded-lg border bg-card p-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label>Title</Label>
            <Input
              value={row.title}
              onChange={(e) =>
                setRows((prev) => prev.map((r, j) => (j === i ? { ...r, title: e.target.value } : r)))
              }
              required
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Description</Label>
            <Textarea
              value={row.description}
              rows={2}
              onChange={(e) =>
                setRows((prev) =>
                  prev.map((r, j) => (j === i ? { ...r, description: e.target.value } : r))
                )
              }
            />
          </div>
          <div className="space-y-1">
            <Label>Amount ({currency})</Label>
            <Input
              type="number"
              min={0.01}
              step="0.01"
              value={row.amount}
              onChange={(e) =>
                setRows((prev) => prev.map((r, j) => (j === i ? { ...r, amount: e.target.value } : r)))
              }
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Due date</Label>
            <Input
              type="date"
              value={row.dueDate}
              onChange={(e) =>
                setRows((prev) => prev.map((r, j) => (j === i ? { ...r, dueDate: e.target.value } : r)))
              }
            />
          </div>
          {rows.length > 1 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="sm:col-span-2"
              onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Remove
            </Button>
          ) : null}
        </div>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="mr-1 h-4 w-4" />
          Add milestone
        </Button>
        <span className={Math.abs(total - agreedAmount) > 0.01 ? "text-destructive" : "text-muted-foreground"}>
          Total: {total.toFixed(2)} / {agreedAmount} {currency}
        </span>
      </div>
      <Button type="submit" disabled={pending || Math.abs(total - agreedAmount) > 0.01}>
        {pending ? "Saving…" : "Save milestones"}
      </Button>
    </form>
  );
}
