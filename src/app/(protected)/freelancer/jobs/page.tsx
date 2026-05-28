import { Role } from "@prisma/client";
import { Suspense } from "react";

import { ProjectResultCard } from "@/components/search/ProjectResultCard";
import { ProjectSearchFilters } from "@/components/search/ProjectSearchFilters";
import { SearchPagination } from "@/components/search/SearchPagination";
import { requireRole } from "@/lib/auth/guard";
import { listTaxonomyOptions } from "@/lib/projects/service";
import { parseProjectSearchParams } from "@/lib/search/params";
import { searchProjects } from "@/lib/search/service";

export default async function FreelancerJobsPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await requireRole([Role.FREELANCER]);
  const params = parseProjectSearchParams(searchParams);
  const [result, taxonomy] = await Promise.all([
    searchProjects({ ...params, excludeClientUserId: session.user.id }),
    listTaxonomyOptions()
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Open projects</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Search and filter briefs you can bid on. Filters persist in the URL.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <Suspense fallback={null}>
          <ProjectSearchFilters taxonomy={taxonomy} showBudgetCustom />
        </Suspense>
        <div className="space-y-6">
          {result.items.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-card p-10 text-center text-sm text-muted-foreground shadow-subtle">
              No open projects match your filters.
            </div>
          ) : (
            <ul className="space-y-4">
              {result.items.map((row) => (
                <ProjectResultCard
                  key={row.id}
                  row={row}
                  proposalHref={`/projects/${row.id}/proposal`}
                />
              ))}
            </ul>
          )}
          <Suspense fallback={null}>
            <SearchPagination
              page={result.page}
              totalPages={result.totalPages}
              total={result.total}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
