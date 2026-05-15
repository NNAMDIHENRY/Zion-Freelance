import { Role } from "@prisma/client";

import { requireRole } from "@/lib/auth/guard";
import { syncMarketplaceTaxonomy } from "@/lib/marketplace/taxonomy";

export default async function DashboardProjectsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  await requireRole([Role.CLIENT]);
  await syncMarketplaceTaxonomy();
  return <div className="space-y-8">{children}</div>;
}
