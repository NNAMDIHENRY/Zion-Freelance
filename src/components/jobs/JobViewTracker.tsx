"use client";

import * as React from "react";

export function JobViewTracker({ jobId }: { jobId: string }) {
  React.useEffect(() => {
    void fetch(`/api/jobs/${jobId}/view`, { method: "POST" }).catch(() => undefined);
  }, [jobId]);
  return null;
}
