import Link from "next/link";
import { Suspense } from "react";

import { CollapsibleFilters } from "@/components/search/CollapsibleFilters";
import { SearchLayout } from "@/components/search/SearchLayout";
import { SearchPagination } from "@/components/search/SearchPagination";
import { Card, CardContent } from "@/components/ui/card";
import { searchClients } from "@/lib/search/clients";

export const metadata = {
  title: "Find clients | Zion TeCHer"
};

export default async function ClientsSearchPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);
  const result = await searchClients({ q: q || undefined, page, pageSize: 12 });

  return (
    <SearchLayout
      title="Find clients"
      description="Discover hiring clients, review their activity, and start conversations."
      filters={
        <CollapsibleFilters>
          <form className="space-y-3" action="/clients" method="get">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="q">
              Search
            </label>
            <input
              id="q"
              name="q"
              defaultValue={q}
              placeholder="Company or name"
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
            <button
              type="submit"
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground"
            >
              Apply
            </button>
          </form>
        </CollapsibleFilters>
      }
      results={
        result.items.length === 0 ? (
          <p className="rounded-2xl border border-border/60 bg-card p-10 text-center text-sm text-muted-foreground">
            No public client profiles match your search.
          </p>
        ) : (
          <ul className="space-y-4">
            {result.items.map((row) => (
              <li key={row.userId}>
                <Link href={`/clients/${row.userId}`}>
                  <Card className="border-border/70 transition hover:border-violet-500/35 hover:shadow-md">
                    <CardContent className="p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-semibold">{row.companyName ?? row.name}</h2>
                          <p className="text-sm text-muted-foreground">{row.name}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {row.profileViewCount} profile views
                        </span>
                      </div>
                      {row.bioPreview ? (
                        <p className="mt-3 text-sm text-muted-foreground">{row.bioPreview}</p>
                      ) : null}
                      <p className="mt-3 text-xs font-medium text-violet-700 dark:text-violet-300">
                        {row.projectCount} projects posted
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )
      }
      pagination={
        <Suspense>
          <SearchPagination page={result.page} totalPages={result.totalPages} total={result.total} />
        </Suspense>
      }
    />
  );
}
