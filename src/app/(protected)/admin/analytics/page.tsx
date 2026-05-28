import { Role } from "@prisma/client";

import { AdminAnalyticsDashboard } from "@/components/admin/AdminAnalyticsDashboard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requireRole } from "@/lib/auth/guard";
import { getPlatformAnalytics } from "@/lib/admin/analytics/service";

export default async function AdminAnalyticsPage() {
  await requireRole([Role.ADMIN]);
  const data = await getPlatformAnalytics();

  return (
    <main className="space-y-8">
      <AdminPageHeader
        title="Platform analytics"
        description="Executive metrics across users, marketplace, finance, and operations."
        crumbs={[{ label: "Analytics" }]}
      />
      <AdminAnalyticsDashboard data={data} />
    </main>
  );
}
