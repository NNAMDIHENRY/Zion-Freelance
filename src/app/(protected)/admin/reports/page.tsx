import { AbuseReportStatus, Role } from "@prisma/client";
import Link from "next/link";

import { AbuseReportsTable } from "@/components/admin/AbuseReportsTable";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { requireRole } from "@/lib/auth/guard";
import { listAbuseReports } from "@/lib/admin/reports/service";
import { adminReportListSchema } from "@/lib/validators/admin";

export default async function AdminReportsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRole([Role.ADMIN]);
  const sp = await searchParams;
  const parsed = adminReportListSchema.safeParse({
    status: sp.status,
    severity: sp.severity,
    page: sp.page,
    pageSize: sp.pageSize
  });
  const input = parsed.success ? parsed.data : adminReportListSchema.parse({});
  const result = await listAbuseReports(input);

  return (
    <main className="space-y-8">
      <AdminPageHeader
        title="Reports & abuse"
        description="Review user submissions, assign severity, and resolve cases."
        crumbs={[{ label: "Reports" }]}
      />

      <nav className="flex flex-wrap gap-2">
        {["", AbuseReportStatus.OPEN, AbuseReportStatus.UNDER_REVIEW].map((s) => (
          <Link
            key={s || "all"}
            href={s ? `/admin/reports?status=${s}` : "/admin/reports"}
            className={
              (sp.status ?? "") === s
                ? "rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground"
                : "rounded-full border px-3 py-1 text-xs text-muted-foreground"
            }
          >
            {s || "All open"}
          </Link>
        ))}
      </nav>

      <AbuseReportsTable items={result.items} />
    </main>
  );
}
