import { Role } from "@prisma/client";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { MarketingContentPanel } from "@/components/admin/MarketingContentPanel";
import { listPlatformBanners, listPlatformPopups } from "@/lib/admin/marketing/service";
import { requireRole } from "@/lib/auth/guard";

export default async function AdminMarketingPage() {
  await requireRole([Role.ADMIN]);
  const [popups, banners] = await Promise.all([listPlatformPopups(), listPlatformBanners()]);

  return (
    <main className="space-y-8">
      <AdminPageHeader
        title="Marketing content"
        description="Manage homepage announcement banners and post-login update popups."
      />
      <MarketingContentPanel popups={popups} banners={banners} />
    </main>
  );
}
