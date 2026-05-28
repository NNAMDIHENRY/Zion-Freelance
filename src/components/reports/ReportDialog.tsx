"use client";

import { AbuseReportCategory, AbuseTargetType } from "@prisma/client";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const CATEGORIES: AbuseReportCategory[] = [
  AbuseReportCategory.SPAM,
  AbuseReportCategory.ABUSE,
  AbuseReportCategory.FRAUD,
  AbuseReportCategory.FAKE_PROJECT,
  AbuseReportCategory.PAYMENT_MISCONDUCT,
  AbuseReportCategory.OTHER
];

export function ReportDialog({
  targetType,
  targetId,
  label = "Report"
}: {
  targetType: AbuseTargetType;
  targetId: string;
  label?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [category, setCategory] = React.useState<AbuseReportCategory>(AbuseReportCategory.ABUSE);
  const [description, setDescription] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ targetType, targetId, category, description })
    });
    setPending(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      toast.error(j.error ?? "Report failed");
      return;
    }
    toast.success("Report submitted. Our team will review it.");
    setOpen(false);
    setDescription("");
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
    );
  }

  return (
    <form className="space-y-3 rounded-xl border p-4" onSubmit={(e) => void submit(e)}>
      <p className="text-sm font-semibold">Report {targetType.toLowerCase()}</p>
      <div className="space-y-1">
        <Label>Category</Label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as AbuseReportCategory)}
          className={cn(
            "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label>Details</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          required
          minLength={20}
          placeholder="What happened?"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Sending…" : "Submit"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
