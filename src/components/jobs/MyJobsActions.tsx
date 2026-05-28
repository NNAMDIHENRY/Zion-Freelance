"use client";

import { JobStatus } from "@prisma/client";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { closeJob, deleteJob, duplicateJob, reopenJob } from "@/lib/jobs/actions";

export function MyJobsActions({
  jobId,
  status,
  slug
}: {
  jobId: string;
  status: JobStatus;
  slug: string;
}) {
  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    const r = await fn();
    if (!r.ok) toast.error(r.error ?? "Failed");
    else toast.success("Done");
  }

  return (
    <div className="flex flex-wrap gap-1">
      <Button asChild size="sm" variant="ghost">
        <Link href={`/dashboard/jobs/${jobId}/analytics`}>Analytics</Link>
      </Button>
      {status === JobStatus.ACTIVE ? (
        <Button size="sm" variant="ghost" onClick={() => run(() => closeJob(jobId))}>
          Close
        </Button>
      ) : status === JobStatus.CLOSED ? (
        <Button size="sm" variant="ghost" onClick={() => run(() => reopenJob(jobId))}>
          Reopen
        </Button>
      ) : null}
      <Button size="sm" variant="ghost" onClick={() => run(() => duplicateJob(jobId))}>
        Duplicate
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="text-destructive"
        onClick={() => run(() => deleteJob(jobId))}
      >
        Delete
      </Button>
      {status === JobStatus.ACTIVE ? (
        <Button asChild size="sm" variant="ghost">
          <Link href={`/jobs/${slug}`} target="_blank">
            View
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
