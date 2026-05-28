import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProjectResultCard } from "@/components/search/ProjectResultCard";
import { ProjectSearchFilters } from "@/components/search/ProjectSearchFilters";
import { SearchPagination } from "@/components/search/SearchPagination";
import { getCategoryBySlug } from "@/lib/marketing/categories-data";
import { syncMarketplaceTaxonomy } from "@/lib/marketplace/taxonomy";
import { prisma } from "@/lib/db";
import { listTaxonomyOptions } from "@/lib/projects/service";
import { parseProjectSearchParams } from "@/lib/search/params";
import { searchProjects } from "@/lib/search/service";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const def = getCategoryBySlug(slug);
  if (!def) return { title: "Category | Zion TeCHer" };
  return { title: `${def.name} | Zion TeCHer` };
}

export default async function CategoryProjectsPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { slug } = await params;
  const def = getCategoryBySlug(slug);
  if (!def) notFound();

  await syncMarketplaceTaxonomy();

  const dbCategory = await prisma.category.findUnique({
    where: { slug },
    select: { id: true, name: true, description: true }
  });
  if (!dbCategory) notFound();

  const parsed = parseProjectSearchParams(searchParams);
  const [result, taxonomy] = await Promise.all([
    searchProjects({ ...parsed, category: dbCategory.id }),
    listTaxonomyOptions()
  ]);

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-12 sm:px-6">
      <header className="max-w-2xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Category</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{dbCategory.name}</h1>
        <p className="text-muted-foreground">
          {dbCategory.description ?? def.description}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <Suspense fallback={null}>
          <ProjectSearchFilters taxonomy={taxonomy} showBudgetCustom />
        </Suspense>
        <div className="space-y-6">
          {result.items.length === 0 ? (
            <p className="rounded-2xl border border-border/60 bg-card p-10 text-center text-sm text-muted-foreground">
              No open projects in this category yet.
            </p>
          ) : (
            <ul className="space-y-4">
              {result.items.map((row) => (
                <ProjectResultCard key={row.id} row={row} />
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
    </main>
  );
}
