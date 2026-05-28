"use client";

import { Bookmark } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { toggleSaveJob } from "@/lib/jobs/actions";
import { cn } from "@/lib/utils";

export function SaveJobButton({
  jobId,
  initialSaved,
  className
}: {
  jobId: string;
  initialSaved: boolean;
  className?: string;
}) {
  const [saved, setSaved] = React.useState(initialSaved);
  const [pending, setPending] = React.useState(false);

  async function toggle() {
    setPending(true);
    const r = await toggleSaveJob(jobId);
    setPending(false);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    setSaved(r.saved);
    toast.success(r.saved ? "Job saved" : "Removed from saved jobs");
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={toggle}
      className={cn("gap-2", className)}
      aria-pressed={saved}
    >
      <Bookmark className={cn("h-4 w-4", saved && "fill-current text-primary")} />
      {saved ? "Saved" : "Save job"}
    </Button>
  );
}
