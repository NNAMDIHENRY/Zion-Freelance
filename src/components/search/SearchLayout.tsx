import type { ReactNode } from "react";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function SearchLayout({
  title,
  description,
  filters,
  results,
  pagination,
  className
}: {
  title: string;
  description: string;
  filters: ReactNode;
  results: ReactNode;
  pagination?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-4 py-12 sm:px-6", className)}>
      <header className="mb-10 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      </header>
      <div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <Suspense fallback={<FiltersSkeleton />}>{filters}</Suspense>
        <div className="space-y-6">
          {results}
          {pagination ? <Suspense fallback={null}>{pagination}</Suspense> : null}
        </div>
      </div>
    </div>
  );
}

function FiltersSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-11 w-full rounded-xl" />
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}
