import Link from "next/link";

import { ReviewCard } from "@/components/reviews/ReviewCard";
import type { PublicReviewRow } from "@/lib/reviews/types";

type ReviewListProps = {
  reviews: PublicReviewRow[];
  page: number;
  totalPages: number;
  basePath: string;
};

export function ReviewList({ reviews, page, totalPages, basePath }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <p className="rounded-2xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
        No published reviews yet.
      </p>
    );
  }

  const pageHref = (p: number) => (p === 1 ? basePath : `${basePath}?page=${p}`);

  return (
    <section className="space-y-4">
      <ul className="space-y-4">
        {reviews.map((review) => (
          <li key={review.id}>
            <ReviewCard review={review} />
          </li>
        ))}
      </ul>
      {totalPages > 1 ? (
        <nav className="flex items-center justify-center gap-4 text-sm" aria-label="Reviews pagination">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="text-primary hover:underline">
              Previous
            </Link>
          ) : (
            <span className="text-muted-foreground">Previous</span>
          )}
          <span className="tabular-nums text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className="text-primary hover:underline">
              Next
            </Link>
          ) : (
            <span className="text-muted-foreground">Next</span>
          )}
        </nav>
      ) : null}
    </section>
  );
}
