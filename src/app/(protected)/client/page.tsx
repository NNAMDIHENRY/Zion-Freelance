import { Role } from "@prisma/client";

import { requireRole } from "@/lib/auth/guard";

export default async function ClientWorkspacePage() {
  await requireRole([Role.CLIENT]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Client workspace</h1>
      <p className="text-sm text-muted-foreground">
        Post projects, review proposals, and manage contracts from here.
      </p>
    </div>
  );
}
