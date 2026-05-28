"use client";

import { ProjectStatus } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { useDashboardModal } from "@/components/dashboard/ui/Modal";
import { deleteProject, updateProjectStatus } from "@/lib/projects/actions";
import { statusLabel } from "@/lib/projects/formatting";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: ProjectStatus[] = [
  ProjectStatus.DRAFT,
  ProjectStatus.OPEN,
  ProjectStatus.IN_PROGRESS,
  ProjectStatus.COMPLETED,
  ProjectStatus.CANCELLED
];

export function ProjectDetailActions({
  projectId,
  status
}: {
  projectId: string;
  status: ProjectStatus;
}) {
  const router = useRouter();
  const { openModal } = useDashboardModal();
  const [busy, setBusy] = React.useState(false);
  const [current, setCurrent] = React.useState(status);

  React.useEffect(() => {
    setCurrent(status);
  }, [status]);

  const options = React.useMemo(() => {
    const base = [...STATUS_OPTIONS];
    if (!base.includes(status)) base.push(status);
    return base;
  }, [status]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Status</span>
        <select
          className={cn(
            "h-9 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
          value={current}
          disabled={busy}
          onChange={async (e) => {
            const next = e.target.value as ProjectStatus;
            setBusy(true);
            const r = await updateProjectStatus(projectId, next);
            setBusy(false);
            if (!r.ok) return;
            setCurrent(next);
            router.refresh();
          }}
        >
          {options.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
      </label>
      <Button type="button" variant="outline" size="sm" asChild>
        <Link href={`/dashboard/projects/${projectId}/edit`}>Edit</Link>
      </Button>
      {current !== ProjectStatus.COMPLETED ? (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-destructive/50 text-destructive hover:bg-destructive/10"
        onClick={() =>
          openModal({
            variant: "confirm",
            title: "Delete this project?",
            description: "This cannot be undone.",
            confirmLabel: "Delete",
            onConfirm: async () => {
              const res = await deleteProject(projectId);
              if (!res.ok) throw new Error(res.error);
              router.push("/dashboard/projects");
              router.refresh();
            }
          })
        }
      >
        Delete
      </Button>
      ) : null}
    </div>
  );
}
