"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/dashboard/ui/Dropdown";
import { useDashboardModal } from "@/components/dashboard/ui/Modal";
import { deleteProject } from "@/lib/projects/actions";

export function ProjectListRowActions({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { openModal } = useDashboardModal();

  return (
    <Dropdown
      align="end"
      trigger={
        <Button type="button" variant="outline" size="icon" className="h-9 w-9" aria-label="Row actions">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      }
    >
      <div className="flex min-w-[10rem] flex-col py-1">
        <Link href={`/dashboard/projects/${projectId}`} className="px-3 py-2 text-sm hover:bg-muted/60">
          View
        </Link>
        <Link href={`/dashboard/projects/${projectId}/edit`} className="px-3 py-2 text-sm hover:bg-muted/60">
          Edit
        </Link>
        <button
          type="button"
          className="px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
          onClick={() =>
            openModal({
              variant: "confirm",
              title: "Delete this project?",
              description: "This cannot be undone.",
              confirmLabel: "Delete",
              onConfirm: async () => {
                const res = await deleteProject(projectId);
                if (!res.ok) throw new Error(res.error);
                router.refresh();
              }
            })
          }
        >
          Delete
        </button>
      </div>
    </Dropdown>
  );
}
