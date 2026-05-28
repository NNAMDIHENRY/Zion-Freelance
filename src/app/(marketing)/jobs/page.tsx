import { Suspense } from "react";
import type { Metadata } from "next";

import { JobCard } from "@/components/jobs/JobCard";
import { JobSearchFilters } from "@/components/jobs/JobSearchFilters";
import { CollapsibleFilters } from "@/components/search/CollapsibleFilters";
import { SearchLayout } from "@/components/search/SearchLayout";
import { SearchPagination } from "@/components/search/SearchPagination";
import { parseJobSearchParams } from "@/lib/jobs/search/params";
import { searchJobs } from "@/lib/jobs/search/service";
import { listJobTaxonomy, seedDefaultJobCategoriesIfEmpty } from "@/lib/jobs/service";
import { expireStaleJobs } from "@/lib/jobs/service";

export const metadata: Metadata = {
  title: "Browse jobs | Zion TeCHer",
  description: "Find remote, onsite, and hybrid jobs from verified employers.",
  openGraph: {
    title: "Browse jobs | Zion TeCHer",
    description: "Professional job board for the Zion TeCHer marketplace."
  }
};

export default async function JobsPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  await seedDefaultJobCategoriesIfEmpty();
  await expireStaleJobs();
  const params = parseJobSearchParams(searchParams);
  const [result, taxonomy] = await Promise.all([searchJobs(params), listJobTaxonomy()]);

  return (
    <SearchLayout
      title="Job board"
      description="Search professional roles by category, location, work mode, and salary."
      filters={
        <CollapsibleFilters>
          <JobSearchFilters taxonomy={taxonomy} />
        </CollapsibleFilters>
      }
      results={
        result.items.length === 0 ? (
          <p className="rounded-2xl border border-border/60 bg-card p-10 text-center text-sm text-muted-foreground">
            No jobs match your filters. Try adjusting search criteria.
          </p>
        ) : (
          <ul className="space-y-4">
            {result.items.map((row) => (
              <JobCard key={row.id} row={row} />
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
