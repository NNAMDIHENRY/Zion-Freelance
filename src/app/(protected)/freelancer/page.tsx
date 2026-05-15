import { Role } from "@prisma/client";

import { WorkspaceStub } from "@/components/dashboard/WorkspaceStub";
import { requireRole } from "@/lib/auth/guard";

export default async function FreelancerWorkspacePage() {
  await requireRole([Role.FREELANCER]);

  return (
    <WorkspaceStub
      title="Freelancer workspace"
      description="Discover projects, send proposals, and deliver work from here."
    />
  );
}
