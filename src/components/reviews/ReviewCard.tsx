import { StarRating } from "@/components/reviews/StarRating";
import type { PublicReviewRow } from "@/lib/reviews/types";

export function ReviewCard({ review }: { review: PublicReviewRow }) {
  const date = new Date(review.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  return (
    <article className="rounded-2xl border border-border/60 bg-card p-5 shadow-subtle">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <p className="min-w-0 space-y-1">
          <span className="block font-medium text-foreground">{review.authorName}</span>
          <span className="block text-xs text-muted-foreground">{review.projectTitle}</span>
        </p>
        <p className="text-right">
          <StarRating value={review.rating} size="sm" />
          <time className="mt-1 block text-xs text-muted-foreground" dateTime={review.createdAt}>
            {date}
          </time>
        </p>
      </header>
      {review.comment ? (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
      ) : (
        <p className="mt-3 text-sm italic text-muted-foreground">No written comment.</p>
      )}
    </article>
  );
}
