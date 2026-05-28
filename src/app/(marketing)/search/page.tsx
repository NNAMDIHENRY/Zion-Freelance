import { Suspense } from "react";

import { ProjectResultCard } from "@/components/search/ProjectResultCard";
import { FreelancerResultCard } from "@/components/search/FreelancerResultCard";
import { SearchPagination } from "@/components/search/SearchPagination";
import { parseFreelancerSearchParams, parseProjectSearchParams } from "@/lib/search/params";
import { searchFreelancers, searchProjects } from "@/lib/search/service";

export const metadata = {
  title: "Search | Zion TeCHer"
};

export default async function MarketingSearchPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const projectParams = parseProjectSearchParams(searchParams);
  const freelancerParams = parseFreelancerSearchParams(searchParams);

  const [projects, freelancers] = await Promise.all([
    searchProjects(projectParams),
    searchFreelancers(freelancerParams)
  ]);

  const q = projectParams.q;

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-12 sm:px-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Search results</h1>
        <p className="text-muted-foreground">
          {q ? `Showing matches for “${q}”.` : "Enter a query from the homepage search."}
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Projects ({projects.total})</h2>
        {projects.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No projects found.</p>
        ) : (
          <ul className="space-y-4">
            {projects.items.map((row) => (
              <ProjectResultCard key={row.id} row={row} />
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

      <section className="space-y-4 border-t border-border/60 pt-10">
        <h2 className="text-lg font-semibold">Freelancers ({freelancers.total})</h2>
        {freelancers.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No freelancers found.</p>
        ) : (
          <ul className="space-y-4">
            {freelancers.items.map((row) => (
              <FreelancerResultCard key={row.id} row={row} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
