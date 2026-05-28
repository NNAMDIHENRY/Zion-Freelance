"use client";

import { AbuseReportStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { adminReportAction } from "@/lib/admin/actions";
import type { AdminAbuseReportRow } from "@/lib/admin/reports/service";

export function AbuseReportsTable({ items }: { items: AdminAbuseReportRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function resolve(reportId: string, status: AbuseReportStatus) {
    startTransition(async () => {
      const res = await adminReportAction({ reportId, status });
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Report updated");
        router.refresh();
      }
    });
  }

  if (!items.length) {
    return (
      <p className="rounded-2xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
        No reports in queue.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((r) => (
        <li key={r.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-subtle">
          <div className="flex flex-wrap justify-between gap-2">
            <p className="font-medium">
              {r.category} · {r.severity}
            </p>
            <span className="text-xs font-medium">{r.status}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {r.targetType} {r.targetId} · by {r.reporterName}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>
          {r.status === AbuseReportStatus.OPEN ||
          r.status === AbuseReportStatus.UNDER_REVIEW ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {r.status === AbuseReportStatus.OPEN ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => resolve(r.id, AbuseReportStatus.UNDER_REVIEW)}
                >
                  Review
                </Button>
              ) : null}
              <Button
                size="sm"
                disabled={pending}
                onClick={() => resolve(r.id, AbuseReportStatus.RESOLVED)}
              >
                Resolve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => resolve(r.id, AbuseReportStatus.DISMISSED)}
              >
                Dismiss
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => resolve(r.id, AbuseReportStatus.ARCHIVED)}
              >
                Archive
              </Button>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
