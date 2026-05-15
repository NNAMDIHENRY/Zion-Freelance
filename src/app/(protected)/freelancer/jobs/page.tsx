import { Role } from "@prisma/client";
import Link from "next/link";

import { requireRole } from "@/lib/auth/guard";
import { budgetLabel } from "@/lib/projects/formatting";
import { listOpenProjectsForFreelancer } from "@/lib/proposals/service";

export default async function FreelancerJobsPage() {
  const session = await requireRole([Role.FREELANCER]);
  const projects = await listOpenProjectsForFreelancer(session.user.id, 50);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Open projects</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Curated briefs you can bid on right away. Submit a structured proposal to stand out.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-card p-10 text-center text-sm text-muted-foreground shadow-subtle">
          No open projects right now. Check back soon or refine your profile to get discovered.
        </div>
      ) : (
        <ul className="space-y-4">
          {projects.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-subtle sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <h2 className="font-semibold text-foreground">{p.title}</h2>
                <p className="text-xs text-muted-foreground">
                  {p.category?.name ?? "Uncategorized"}
                  {p.deadline ? ` · Deadline ${p.deadline.toLocaleDateString()}` : ""}
                </p>
                <p className="text-sm tabular-nums text-muted-foreground">
                  {budgetLabel(p.budgetMin, p.budgetMax, p.currency)}
                </p>
              </div>
              <Link
                href={`/dashboard/projects/${p.id}/proposal`}
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
              >
                Submit proposal
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
