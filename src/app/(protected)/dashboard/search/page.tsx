import { Role } from "@prisma/client";
import { Suspense } from "react";

import { ProjectResultCard } from "@/components/search/ProjectResultCard";
import { FreelancerResultCard } from "@/components/search/FreelancerResultCard";
import { SearchPagination } from "@/components/search/SearchPagination";
import { getSession } from "@/lib/auth/session";
import { parseFreelancerSearchParams, parseProjectSearchParams } from "@/lib/search/params";
import { searchFreelancers, searchProjects } from "@/lib/search/service";

export default async function DashboardSearchPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await getSession();
  const projectParams = parseProjectSearchParams(searchParams);
  const freelancerParams = parseFreelancerSearchParams(searchParams);

  const projectQuery =
    session?.user.role === Role.FREELANCER && session.user.id
      ? { ...projectParams, excludeClientUserId: session.user.id }
      : projectParams;

  const [projects, freelancers] = await Promise.all([
    searchProjects(projectQuery),
    searchFreelancers(freelancerParams)
  ]);

  const q = projectParams.q;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
        <p className="text-sm text-muted-foreground">
          {q ? `Results for “${q}”.` : "Use the top bar search to find projects and people."}
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Projects ({projects.total})
        </h2>
        {projects.items.length === 0 ? (
          <p className="rounded-2xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
            No projects match.
          </p>
        ) : (
          <ul className="space-y-4">
            {projects.items.map((row) => (
              <ProjectResultCard
                key={row.id}
                row={row}
                proposalHref={
                  session?.user.role === Role.FREELANCER
                    ? `/dashboard/projects/${row.id}/proposal`
                    : undefined
                }
              />
            ))}
          </ul>
        )}
        <Suspense fallback={null}>
          <SearchPagination
            page={projects.page}
            totalPages={projects.totalPages}
            total={projects.total}
          />
        </Suspense>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Freelancers ({freelancers.total})
        </h2>
        {freelancers.items.length === 0 ? (
          <p className="rounded-2xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
            No freelancers match.
          </p>
        ) : (
          <ul className="space-y-4">
            {freelancers.items.map((row) => (
              <FreelancerResultCard key={row.id} row={row} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
