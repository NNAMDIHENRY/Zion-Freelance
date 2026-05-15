import { Role } from "@prisma/client";

import { WorkspaceStub } from "@/components/dashboard/WorkspaceStub";
import { requireRole } from "@/lib/auth/guard";

export default async function AdminUsersPage() {
  await requireRole([Role.ADMIN]);

  return (
    <WorkspaceStub
      title="Users"
      description="Search, suspend, and audit accounts with moderation tooling in a later release."
    />
  );
}
