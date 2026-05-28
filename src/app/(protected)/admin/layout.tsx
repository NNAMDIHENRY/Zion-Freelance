import { Role } from "@prisma/client";

import { requireRole } from "@/lib/auth/guard";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole([Role.ADMIN]);
  return <div className="admin-workspace space-y-6">{children}</div>;
}
