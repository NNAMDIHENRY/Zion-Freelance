"use client";

import { JobStatus } from "@prisma/client";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { adminModerateJob } from "@/lib/jobs/actions";

export type AdminJobRow = {
  id: string;
  title: string;
  slug: string;
  status: JobStatus;
  companyName: string;
  posterName: string;
  applicationCount: number;
  viewCount: number;
  featured: boolean;
  createdAt: string;
};

export function JobModerationTable({ rows }: { rows: AdminJobRow[] }) {
  const [pending, setPending] = React.useState<string | null>(null);

  async function moderate(jobId: string, status: JobStatus, featured?: boolean) {
    setPending(jobId);
    const r = await adminModerateJob({ jobId, status, featured });
    setPending(null);
    if (!r.ok) toast.error(r.error);
    else toast.success("Job updated");
  }

  if (!rows.length) {
    return (
      <p className="rounded-xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
        No jobs pending moderation.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-border/60 bg-muted/40 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Job</th>
            <th className="px-4 py-3">Poster</th>
            <th className="px-4 py-3">Stats</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border/40">
              <td className="px-4 py-3">
                <p className="font-medium">{row.title}</p>
                <p className="text-xs text-muted-foreground">{row.companyName}</p>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{row.posterName}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {row.viewCount} views · {row.applicationCount} apps
              </td>
              <td className="px-4 py-3">{row.status}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={pending === row.id}
                    onClick={() => moderate(row.id, JobStatus.ACTIVE, true)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending === row.id}
                    onClick={() => moderate(row.id, JobStatus.REJECTED)}
                  >
                    Reject
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
