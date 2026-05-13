import { Role } from "@prisma/client";

import { requireRole } from "@/lib/auth/guard";

export default async function FreelancerWorkspacePage() {
  await requireRole([Role.FREELANCER]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">
        Freelancer workspace
      </h1>
      <p className="text-sm text-muted-foreground">
        Discover projects, send proposals, and deliver work from here.
      </p>
    </div>
  );
}
