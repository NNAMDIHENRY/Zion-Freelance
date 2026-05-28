import Link from "next/link";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";

import { ProjectApplicantMessaging } from "@/components/messaging/ProjectApplicantMessaging";
import { ProjectDetailActions } from "@/components/projects/ProjectDetailActions";
import { getSession } from "@/lib/auth/session";
import { budgetLabel, statusLabel } from "@/lib/projects/formatting";
import { getClientProfileIdForUser, getProjectOwnedByClient } from "@/lib/projects/service";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) return null;
  const clientId = await getClientProfileIdForUser(session.user.id);
  if (!clientId) return null;

  const project = await getProjectOwnedByClient(id, clientId);
  if (!project) notFound();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{project.title}</h1>
          <p className="text-sm text-muted-foreground">
            {project.category?.name ?? "Uncategorized"} · {statusLabel(project.status)}
          </p>
          <p className="text-sm">
            <Link href="/dashboard/projects" className="text-primary underline-offset-4 hover:underline">
              All projects
            </Link>
          </p>
        </div>
        <ProjectDetailActions projectId={project.id} status={project.status} />
      </div>

      <div className="rounded-2xl border border-border/60 bg-muted/10 p-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium text-foreground">Proposals</p>
            <p className="text-muted-foreground">
              {project._count.proposals} submission{project._count.proposals === 1 ? "" : "s"}
            </p>
          </div>
          <Link
            href={`/dashboard/projects/${project.id}/proposals`}
            className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-muted/80"
          >
            Review proposals
          </Link>
        </div>
      </div>

      {session.user.role === Role.CLIENT ? (
        <ProjectApplicantMessaging projectId={project.id} />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-subtle lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Description</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{project.description}</p>
        </div>
        <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-subtle">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Summary</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Budget</dt>
              <dd className="mt-1 font-medium tabular-nums">
                {budgetLabel(project.budgetMin, project.budgetMax, project.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Deadline</dt>
              <dd className="mt-1 font-medium">
                {project.deadline ? project.deadline.toLocaleDateString() : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Skills</dt>
              <dd className="mt-1 flex flex-wrap gap-2">
                {project.skills.length ? (
                  project.skills.map((ps) => (
                    <span
                      key={ps.id}
                      className="rounded-full bg-muted/80 px-2 py-0.5 text-xs font-medium text-foreground"
                    >
                      {ps.skill.name}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-subtle">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Attachments</h2>
        {project.attachments.length ? (
          <ul className="mt-4 divide-y divide-border/60">
            {project.attachments.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <span className="min-w-0 truncate font-medium">{a.originalName}</span>
                <span className="text-xs text-muted-foreground">
                  {(a.sizeBytes / 1024).toFixed(1)} KB · {a.mimeType}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No attachments yet.</p>
        )}
      </div>
    </div>
  );
}
