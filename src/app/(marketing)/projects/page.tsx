import { Suspense } from "react";

import { ProjectResultCard } from "@/components/search/ProjectResultCard";
import { CollapsibleFilters } from "@/components/search/CollapsibleFilters";
import { ProjectSearchFilters } from "@/components/search/ProjectSearchFilters";
import { SearchLayout } from "@/components/search/SearchLayout";
import { SearchPagination } from "@/components/search/SearchPagination";
import { listTaxonomyOptions } from "@/lib/projects/service";
import { parseProjectSearchParams } from "@/lib/search/params";
import { searchProjects } from "@/lib/search/service";

export const metadata = {
  title: "Browse projects | Zion TeCHer"
};

export default async function ProjectsSearchPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const params = parseProjectSearchParams(searchParams);
  const [result, taxonomy] = await Promise.all([
    searchProjects(params),
    listTaxonomyOptions()
  ]);

  return (
    <SearchLayout
      title="Browse open projects"
      description="Search by title, description, skills, and category. Filter by budget and sort by date or deadline."
      filters={
        <CollapsibleFilters>
          <ProjectSearchFilters taxonomy={taxonomy} showBudgetCustom />
        </CollapsibleFilters>
      }
      results={
        result.items.length === 0 ? (
          <p className="rounded-2xl border border-border/60 bg-card p-10 text-center text-sm text-muted-foreground">
            No projects match your filters.
          </p>
        ) : (
          <ul className="space-y-4">
            {result.items.map((row) => (
              <ProjectResultCard key={row.id} row={row} />
            ))}
          </ul>
        )
      }
      pagination={
        <Suspense>
          <SearchPagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
          />
        </Suspense>
      }
    />
  );
}
