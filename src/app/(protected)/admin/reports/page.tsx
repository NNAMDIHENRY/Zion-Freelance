import { Role } from "@prisma/client";

import { WorkspaceStub } from "@/components/dashboard/WorkspaceStub";
import { requireRole } from "@/lib/auth/guard";

export default async function AdminReportsPage() {
  await requireRole([Role.ADMIN]);

  return (
    <WorkspaceStub
      title="Reports"
      description="Operational dashboards and exports hook in once reporting endpoints exist."
    />
  );
}
