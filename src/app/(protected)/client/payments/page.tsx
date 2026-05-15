import { Role } from "@prisma/client";

import { WorkspaceStub } from "@/components/dashboard/WorkspaceStub";
import { requireRole } from "@/lib/auth/guard";

export default async function ClientPaymentsPage() {
  await requireRole([Role.CLIENT]);

  return (
    <WorkspaceStub
      title="Payments"
      description="Invoices, escrow status, and reconciliation will appear here once payouts are wired."
    />
  );
}
