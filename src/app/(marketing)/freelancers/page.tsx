import { Suspense } from "react";

import { FreelancerResultCard } from "@/components/search/FreelancerResultCard";
import { CollapsibleFilters } from "@/components/search/CollapsibleFilters";
import { FreelancerSearchFilters } from "@/components/search/FreelancerSearchFilters";
import { SearchLayout } from "@/components/search/SearchLayout";
import { SearchPagination } from "@/components/search/SearchPagination";
import { listTaxonomyOptions } from "@/lib/projects/service";
import { parseFreelancerSearchParams } from "@/lib/search/params";
import { searchFreelancers } from "@/lib/search/service";

export const metadata = {
  title: "Find freelancers | Zion TeCHer"
};

export default async function FreelancersSearchPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const params = parseFreelancerSearchParams(searchParams);
  const [result, taxonomy] = await Promise.all([
    searchFreelancers(params),
    listTaxonomyOptions()
  ]);

  return (
    <SearchLayout
      title="Find freelancers"
      description="Search by name, title, skills, category, and bio keywords. Filter by rate and rating."
      filters={
        <CollapsibleFilters>
          <FreelancerSearchFilters taxonomy={taxonomy} />
        </CollapsibleFilters>
      }
      results={
        result.items.length === 0 ? (
          <p className="rounded-2xl border border-border/60 bg-card p-10 text-center text-sm text-muted-foreground">
            No freelancers match your filters.
          </p>
        ) : (
          <ul className="space-y-4">
            {result.items.map((row) => (
              <FreelancerResultCard key={row.id} row={row} />
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
