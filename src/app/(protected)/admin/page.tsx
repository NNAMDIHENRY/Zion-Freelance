import { Role } from "@prisma/client";

import { requireRole } from "@/lib/auth/guard";

export default async function AdminPage() {
  await requireRole([Role.ADMIN]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
      <p className="text-sm text-muted-foreground">
        Admin-only surface. Create admin users with a database seed or migration
        (signup does not allow the Admin role).
      </p>
      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-subtle">
        <p className="text-sm text-muted-foreground">
          Wire moderation, disputes, and payouts here next.
        </p>
      </div>
    </div>
  );
}
