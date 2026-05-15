import Link from "next/link";

import { ProjectsDataTable } from "@/components/projects/ProjectsDataTable";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { budgetLabel, statusLabel } from "@/lib/projects/formatting";
import { getClientProfileIdForUser, listProjectsForClient } from "@/lib/projects/service";

export default async function DashboardProjectsPage() {
  const session = await getSession();
  if (!session?.user) return null;
  const clientId = await getClientProfileIdForUser(session.user.id);
  if (!clientId) return null;

  const projects = await listProjectsForClient(clientId);
  const rows = projects.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category?.name ?? "—",
    statusDisplay: statusLabel(p.status),
    budget: budgetLabel(p.budgetMin, p.budgetMax, p.currency),
    deadline: p.deadline ? p.deadline.toISOString() : null,
    updatedAt: p.updatedAt.toISOString(),
    attachmentCount: p._count.attachments
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Draft briefs, open them to talent, and keep files organized in one place.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/projects/new">New project</Link>
        </Button>
      </div>
      <ProjectsDataTable rows={rows} />
    </div>
  );
}
