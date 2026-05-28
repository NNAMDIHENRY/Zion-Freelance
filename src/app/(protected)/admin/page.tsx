import { Role } from "@prisma/client";

import { AdminOverviewDashboard } from "@/components/admin/AdminOverviewDashboard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requireRole } from "@/lib/auth/guard";
import { getAdminOverviewKpis } from "@/lib/admin/analytics/service";

export default async function AdminPage() {
  await requireRole([Role.ADMIN]);
  const overview = await getAdminOverviewKpis();

  return (
    <main className="space-y-8">
      <AdminPageHeader
        title="Platform administration"
        description="Centralized governance, trust, compliance, and operational oversight."
      />
      <AdminOverviewDashboard data={overview} />
    </main>
  );
}
