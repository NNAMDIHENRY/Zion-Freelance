import { DisputeStatus, Role } from "@prisma/client";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DisputeManagementPanel } from "@/components/admin/DisputeManagementPanel";
import { requireRole } from "@/lib/auth/guard";
import { listAdminDisputes } from "@/lib/admin/disputes/service";
import { adminDisputeListSchema } from "@/lib/validators/admin";

export default async function AdminDisputesPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRole([Role.ADMIN]);
  const sp = await searchParams;
  const parsed = adminDisputeListSchema.safeParse({
    status: sp.status,
    page: sp.page,
    pageSize: sp.pageSize
  });
  const input = parsed.success ? parsed.data : adminDisputeListSchema.parse({});
  const result = await listAdminDisputes(input);

  return (
    <main className="space-y-8">
      <AdminPageHeader
        title="Dispute resolution"
        description="Inspect evidence, escalate cases, and finalize outcomes."
        crumbs={[{ label: "Disputes" }]}
      />

      <nav className="flex flex-wrap gap-2">
        {["", ...Object.values(DisputeStatus)].map((s) => (
          <Link
            key={s || "all"}
            href={s ? `/admin/disputes?status=${s}` : "/admin/disputes"}
            className={
              (sp.status ?? "") === s
                ? "rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                : "rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
            }
          >
            {s || "All"}
          </Link>
        ))}
      </nav>

      <DisputeManagementPanel items={result.items} />
    </main>
  );
}
