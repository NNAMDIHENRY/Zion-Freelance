"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitProposalAction, updateProposalAction } from "@/lib/proposals/actions";
import { cn } from "@/lib/utils";

const PRESET_DAYS = [7, 14, 21, 30, 45, 60, 90] as const;

export type ProposalFormProps = {
  projectId: string;
  currency: string;
  mode: "create" | "edit";
  proposalId?: string;
  initial?: {
    proposedPrice: number;
    coverLetter: string;
    deliveryDays: number;
  };
  lockedReason?: string;
};

export function ProposalForm({ projectId, currency, mode, proposalId, initial, lockedReason }: ProposalFormProps) {
  const router = useRouter();
  const [price, setPrice] = React.useState(initial?.proposedPrice?.toString() ?? "");
  const [letter, setLetter] = React.useState(initial?.coverLetter ?? "");
  const [preset, setPreset] = React.useState<string>(() => {
    const d = initial?.deliveryDays;
    if (d && PRESET_DAYS.includes(d as (typeof PRESET_DAYS)[number])) return String(d);
    return "14";
  });
  const [customDays, setCustomDays] = React.useState(
    initial?.deliveryDays && !PRESET_DAYS.includes(initial.deliveryDays as (typeof PRESET_DAYS)[number])
      ? String(initial.deliveryDays)
      : "30"
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});

  if (lockedReason) {
    return (
      <div className="rounded-2xl border border-border/60 bg-muted/20 p-6 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Proposal locked</p>
        <p className="mt-2">{lockedReason}</p>
        {proposalId ? (
          <Button type="button" variant="link" className="mt-4 h-auto px-0" asChild>
            <Link href={`/dashboard/proposals/${proposalId}`}>View proposal</Link>
          </Button>
        ) : null}
      </div>
    );
  }

  const deliveryDays =
    preset === "custom" ? Number(customDays || 0) : Number(preset || 0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setSubmitting(true);
    const payload = {
      proposedPrice: Number(price),
      coverLetter: letter,
      deliveryDays
    };
    try {
      const res =
        mode === "edit" && proposalId
          ? await updateProposalAction(proposalId, payload)
          : await submitProposalAction(projectId, payload);
      if (!res.ok) {
        if ("fieldErrors" in res && res.fieldErrors) setFieldErrors(res.fieldErrors);
        toast.error(res.error);
        return;
      }
      toast.success(mode === "edit" ? "Proposal updated" : "Proposal submitted");
      router.push(`/dashboard/proposals/${res.id}`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const err = (name: string) => fieldErrors[name]?.[0];

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-subtle">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Budget currency</p>
        <p className="mt-1 text-sm font-semibold">{currency}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="proposedPrice">Proposed price ({currency})</Label>
        <Input
          id="proposedPrice"
          inputMode="decimal"
          autoComplete="off"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="e.g. 2500"
          disabled={submitting}
        />
        {err("proposedPrice") ? <p className="text-sm text-destructive">{err("proposedPrice")}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="delivery">Delivery timeline</Label>
        <select
          id="delivery"
          className={cn(
            "h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          )}
          value={preset}
          disabled={submitting}
          onChange={(e) => setPreset(e.target.value)}
        >
          {PRESET_DAYS.map((d) => (
            <option key={d} value={d}>
              {d} days
            </option>
          ))}
          <option value="custom">Custom…</option>
        </select>
        {preset === "custom" ? (
          <div className="pt-2">
            <Input
              inputMode="numeric"
              min={1}
              max={730}
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
              disabled={submitting}
              placeholder="Number of days"
            />
          </div>
        ) : null}
        {err("deliveryDays") ? <p className="text-sm text-destructive">{err("deliveryDays")}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="coverLetter">Cover letter</Label>
        <Textarea
          id="coverLetter"
          value={letter}
          onChange={(e) => setLetter(e.target.value)}
          disabled={submitting}
          placeholder="Explain how you will deliver, relevant experience, and clarifying questions."
          className="min-h-[200px]"
        />
        <p className="text-xs text-muted-foreground">{letter.trim().length} / 12000 characters (min 40)</p>
        {err("coverLetter") ? <p className="text-sm text-destructive">{err("coverLetter")}</p> : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : mode === "edit" ? "Update proposal" : "Submit proposal"}
        </Button>
        <Button type="button" variant="outline" disabled={submitting} onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
