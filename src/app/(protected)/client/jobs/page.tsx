import { Role } from "@prisma/client";

import { WorkspaceStub } from "@/components/dashboard/WorkspaceStub";
import { requireRole } from "@/lib/auth/guard";

export default async function ClientJobsPage() {
  await requireRole([Role.CLIENT]);

  return (
    <WorkspaceStub
      title="Manage jobs"
      description="Kanban, approvals, and collaborator tools will plug into this route."
    />
  );
}
