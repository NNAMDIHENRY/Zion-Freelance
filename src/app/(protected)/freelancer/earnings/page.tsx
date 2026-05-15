import { Role } from "@prisma/client";

import { WorkspaceStub } from "@/components/dashboard/WorkspaceStub";
import { requireRole } from "@/lib/auth/guard";

export default async function FreelancerEarningsPage() {
  await requireRole([Role.FREELANCER]);

  return (
    <WorkspaceStub
      title="Earnings"
      description="Milestone releases, tax-ready exports, and payout timelines will surface here."
    />
  );
}
