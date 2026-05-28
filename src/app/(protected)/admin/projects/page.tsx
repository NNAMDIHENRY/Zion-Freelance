import { ProjectModerationStatus, Role } from "@prisma/client";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ProjectModerationTable } from "@/components/admin/ProjectModerationTable";
import { requireRole } from "@/lib/auth/guard";
import { listAdminProjects } from "@/lib/admin/projects/service";
import { adminProjectListSchema } from "@/lib/validators/admin";

export default async function AdminProjectsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRole([Role.ADMIN]);
  const sp = await searchParams;
  const parsed = adminProjectListSchema.safeParse({
    q: sp.q,
    moderationStatus: sp.moderationStatus,
    page: sp.page,
    pageSize: sp.pageSize
  });
  const input = parsed.success ? parsed.data : adminProjectListSchema.parse({});
  const result = await listAdminProjects(input);

  return (
    <main className="space-y-8">
      <AdminPageHeader
        title="Project moderation"
        description="Review listings, freeze suspicious projects, and archive violations."
        crumbs={[{ label: "Projects" }]}
      />

      <form className="flex flex-wrap gap-2" method="get">
        <select
          name="moderationStatus"
          defaultValue={sp.moderationStatus ?? ""}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {Object.values(ProjectModerationStatus).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Filter
        </button>
      </form>

      <ProjectModerationTable items={result.items} />
    </main>
  );
}
