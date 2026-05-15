import Link from "next/link";
import { notFound } from "next/navigation";

import { ProjectForm } from "@/components/projects/ProjectForm";
import type { ProjectFormInitial } from "@/components/projects/project-types";
import { getSession } from "@/lib/auth/session";
import { getClientProfileIdForUser, getProjectOwnedByClient, listTaxonomyOptions } from "@/lib/projects/service";

function toDateInput(d: Date | null) {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) return null;
  const clientId = await getClientProfileIdForUser(session.user.id);
  if (!clientId) return null;

  const project = await getProjectOwnedByClient(id, clientId);
  if (!project) notFound();

  const minStr = project.budgetMin?.toString() ?? "";
  const maxStr = project.budgetMax?.toString() ?? "";
  const budgetIsRange = Boolean(project.budgetMax && maxStr !== minStr);

  const initial: ProjectFormInitial = {
    id: project.id,
    title: project.title,
    description: project.description,
    categoryId: project.categoryId ?? "",
    skillIds: project.skills.map((ps) => ps.skill.id),
    budgetMin: minStr,
    budgetMax: maxStr,
    budgetIsRange,
    deadline: toDateInput(project.deadline),
    status: project.status,
    attachments: project.attachments.map((a) => ({
      id: a.id,
      originalName: a.originalName,
      sizeBytes: a.sizeBytes
    }))
  };

  const { categories, skills } = await listTaxonomyOptions();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit project</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          <Link href={`/dashboard/projects/${project.id}`} className="text-primary underline-offset-4 hover:underline">
            Back to project
          </Link>
        </p>
      </div>
      <ProjectForm mode="edit" categories={categories} skills={skills} initial={initial} />
    </div>
  );
}
