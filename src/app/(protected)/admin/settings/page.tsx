import { Role } from "@prisma/client";

import { WorkspaceStub } from "@/components/dashboard/WorkspaceStub";
import { requireRole } from "@/lib/auth/guard";

export default async function AdminSettingsPage() {
  await requireRole([Role.ADMIN]);

  return (
    <WorkspaceStub
      title="System settings"
      description="Feature flags, integrations, and compliance controls will be centralized here."
    />
  );
}
