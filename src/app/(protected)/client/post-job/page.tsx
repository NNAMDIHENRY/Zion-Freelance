import { Role } from "@prisma/client";

import { WorkspaceStub } from "@/components/dashboard/WorkspaceStub";
import { requireRole } from "@/lib/auth/guard";

export default async function ClientPostJobPage() {
  await requireRole([Role.CLIENT]);

  return (
    <WorkspaceStub
      title="Post a job"
      description="Guided brief builder, budget guardrails, and visibility controls ship in the jobs module."
    />
  );
}
