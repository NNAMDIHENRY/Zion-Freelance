"use client";

import { JobApplicationStatus } from "@prisma/client";
import * as React from "react";
import { toast } from "sonner";

import { updateApplicationStatus } from "@/lib/jobs/actions";

export function ApplicationStatusSelect({
  applicationId,
  current
}: {
  applicationId: string;
  current: JobApplicationStatus;
}) {
  const [pending, setPending] = React.useState(false);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setPending(true);
    const r = await updateApplicationStatus({
      applicationId,
      status: e.target.value as JobApplicationStatus
    });
    setPending(false);
    if (!r.ok) toast.error(r.error);
    else toast.success("Status updated");
  }

  return (
    <select
      value={current}
      disabled={pending || current === JobApplicationStatus.WITHDRAWN}
      onChange={onChange}
      className="rounded-lg border border-input bg-background px-2 py-1 text-xs"
      aria-label="Application status"
    >
      {Object.values(JobApplicationStatus)
        .filter((s) => s !== JobApplicationStatus.WITHDRAWN)
        .map((s) => (
          <option key={s} value={s}>
            {s.replace(/_/g, " ")}
          </option>
        ))}
    </select>
  );
}
