"use client";

import type { DisputeStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { adminDisputeAction } from "@/lib/admin/actions";
import type { AdminDisputeRow } from "@/lib/admin/disputes/service";

export function DisputeManagementPanel({ items }: { items: AdminDisputeRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState<Record<string, string>>({});

  function resolve(
    disputeId: string,
    status: Extract<DisputeStatus, "RESOLVED" | "DISMISSED" | "ESCALATED" | "UNDER_REVIEW">
  ) {
    startTransition(async () => {
      const res = await adminDisputeAction({
        disputeId,
        status,
        resolution: notes[disputeId]
      });
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Dispute updated");
        router.refresh();
      }
    });
  }

  if (!items.length) {
    return (
      <p className="rounded-2xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
        No disputes in this queue.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {items.map((d) => (
        <li key={d.id} className="rounded-2xl border border-border/60 bg-card p-5 shadow-subtle">
          <header className="flex flex-wrap justify-between gap-2">
            <div>
              <p className="font-medium">{d.projectTitle}</p>
              <p className="text-xs text-muted-foreground">
                Opened by {d.openedByName} · {new Date(d.createdAt).toLocaleString()}
              </p>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{d.status}</span>
          </header>
          <p className="mt-3 text-sm">{d.reason}</p>
          {d.evidence ? (
            <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-muted/40 p-2 text-xs">
              {JSON.stringify(d.evidence, null, 2)}
            </pre>
          ) : null}
          <textarea
            className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            placeholder="Resolution notes"
            rows={2}
            value={notes[d.id] ?? d.resolution ?? ""}
            onChange={(e) => setNotes((n) => ({ ...n, [d.id]: e.target.value }))}
          />
          <footer className="mt-3 flex flex-wrap gap-2">
            {d.status !== "UNDER_REVIEW" ? (
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => resolve(d.id, "UNDER_REVIEW")}
              >
                Under review
              </Button>
            ) : null}
            {d.status !== "ESCALATED" ? (
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => resolve(d.id, "ESCALATED")}
              >
                Escalate
              </Button>
            ) : null}
            <Button size="sm" disabled={pending} onClick={() => resolve(d.id, "RESOLVED")}>
              Resolve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive"
              disabled={pending}
              onClick={() => resolve(d.id, "DISMISSED")}
            >
              Dismiss
            </Button>
          </footer>
        </li>
      ))}
    </ul>
  );
}
