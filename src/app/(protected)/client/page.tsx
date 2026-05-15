import { Role } from "@prisma/client";

import { WorkspaceStub } from "@/components/dashboard/WorkspaceStub";
import { requireRole } from "@/lib/auth/guard";

export default async function ClientWorkspacePage() {
  await requireRole([Role.CLIENT]);

  return (
    <WorkspaceStub
      title="Client workspace"
      description="Post projects, review proposals, and manage contracts from here."
    />
  );
}
