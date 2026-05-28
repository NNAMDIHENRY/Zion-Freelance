import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { JobCard } from "@/components/jobs/JobCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getFeaturedJobs,
  getLatestJobs,
  getPopularJobCategories
} from "@/lib/jobs/search/service";
import { seedDefaultJobCategoriesIfEmpty } from "@/lib/jobs/service";

export async function JobsHomeSections() {
  await seedDefaultJobCategoriesIfEmpty();
  const [featured, latest, categories] = await Promise.all([
    getFeaturedJobs(4),
    getLatestJobs(4),
    getPopularJobCategories(6)
  ]);

  if (!featured.length && !latest.length && !categories.length) return null;

  return (
    <section className="space-y-16 border-t border-border/60 py-16">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Job board</h2>
          <p className="mt-1 text-muted-foreground">
            Full-time, contract, and hybrid roles from verified employers.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/jobs">
            Browse all jobs <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {categories.length > 0 ? (
        <div>
          <h3 className="mb-4 text-lg font-semibold">Popular categories</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <Link key={c.id} href={`/jobs?category=${c.slug}`}>
                <Card className="transition hover:border-primary/40">
                  <CardContent className="flex items-center justify-between p-4">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-sm text-muted-foreground">{c.jobCount} jobs</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {featured.length > 0 ? (
        <div>
          <h3 className="mb-4 text-lg font-semibold">Featured jobs</h3>
          <ul className="space-y-4">
            {featured.map((row) => (
              <JobCard key={row.id} row={row} />
            ))}
          </ul>
        </div>
      ) : null}

      {latest.length > 0 ? (
        <div>
          <h3 className="mb-4 text-lg font-semibold">Latest jobs</h3>
          <ul className="space-y-4">
            {latest.map((row) => (
              <JobCard key={row.id} row={row} />
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
