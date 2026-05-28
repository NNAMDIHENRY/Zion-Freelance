import { Role } from "@prisma/client";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ModerationQueuePanel } from "@/components/admin/ModerationQueuePanel";
import { requireRole } from "@/lib/auth/guard";
import { getModerationQueue } from "@/lib/admin/payments/service";

export default async function AdminModerationPage() {
  await requireRole([Role.ADMIN]);
  const queue = await getModerationQueue();

  return (
    <main className="space-y-8">
      <AdminPageHeader
        title="Moderation queue"
        description="Flagged users, projects, reports, disputes, and withdrawal reviews."
        crumbs={[{ label: "Moderation" }]}
      />
      <ModerationQueuePanel queue={queue} />
    </main>
  );
}
