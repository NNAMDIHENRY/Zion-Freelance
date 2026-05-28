"use client";

import { ProjectModerationStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { adminProjectModerationAction } from "@/lib/admin/actions";
import type { AdminProjectRow } from "@/lib/admin/projects/service";

const ACTIONS: { label: string; status: ProjectModerationStatus }[] = [
  { label: "Flag", status: ProjectModerationStatus.FLAGGED },
  { label: "Review", status: ProjectModerationStatus.UNDER_REVIEW },
  { label: "Freeze", status: ProjectModerationStatus.FROZEN },
  { label: "Restore", status: ProjectModerationStatus.ACTIVE },
  { label: "Remove", status: ProjectModerationStatus.REMOVED }
];

export function ProjectModerationTable({ items }: { items: AdminProjectRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function moderate(projectId: string, status: ProjectModerationStatus) {
    startTransition(async () => {
      const res = await adminProjectModerationAction({ projectId, status });
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Project updated");
        router.refresh();
      }
    });
  }

  if (!items.length) {
    return (
      <p className="rounded-2xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
        No projects found.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((p) => (
        <li
          key={p.id}
          className="rounded-2xl border border-border/60 bg-card p-4 shadow-subtle"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium">{p.title}</p>
              <p className="text-xs text-muted-foreground">
                {p.clientName} · {p.proposalCount} proposals · {p.status}
              </p>
              <p className="mt-1 text-xs">
                Moderation: <span className="font-medium">{p.moderationStatus}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              {ACTIONS.filter((a) => a.status !== p.moderationStatus).map((a) => (
                <Button
                  key={a.status}
                  size="sm"
                  variant="outline"
                  className={
                    a.status === ProjectModerationStatus.REMOVED ? "text-destructive" : undefined
                  }
                  disabled={pending}
                  onClick={() => moderate(p.id, a.status)}
                >
                  {a.label}
                </Button>
              ))}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
