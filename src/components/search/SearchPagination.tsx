"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

export function SearchPagination({
  page,
  totalPages,
  total,
  className
}: {
  page: number;
  totalPages: number;
  total: number;
  className?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hrefFor = (p: number) => {
    const q = new URLSearchParams(searchParams.toString());
    if (p <= 1) q.delete("page");
    else q.set("page", String(p));
    const s = q.toString();
    return s ? `${pathname}?${s}` : pathname;
  };

  if (total === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 text-xs text-muted-foreground shadow-subtle",
        className
      )}
    >
      <span>
        Page {page} of {Math.max(1, totalPages)} · {total} results
      </span>
      <div className="flex gap-2">
        <Link
          href={hrefFor(page - 1)}
          aria-disabled={page <= 1}
          className={cn(
            "rounded-md border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent",
            page <= 1 && "pointer-events-none opacity-40"
          )}
        >
          Previous
        </Link>
        <Link
          href={hrefFor(page + 1)}
          aria-disabled={page >= totalPages}
          className={cn(
            "rounded-md border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent",
            page >= totalPages && "pointer-events-none opacity-40"
          )}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
