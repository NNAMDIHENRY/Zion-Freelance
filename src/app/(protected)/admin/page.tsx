import { Role } from "@prisma/client";

import { WorkspaceStub } from "@/components/dashboard/WorkspaceStub";
import { requireRole } from "@/lib/auth/guard";

export default async function AdminPage() {
  await requireRole([Role.ADMIN]);

  return (
    <WorkspaceStub
      title="Admin"
      description="Admin-only surface. Create admin users with a database seed or migration (signup does not allow the Admin role)."
    />
  );
}
