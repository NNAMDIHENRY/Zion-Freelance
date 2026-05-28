import { StarRating } from "@/components/reviews/StarRating";
import type { ReviewStats } from "@/lib/reviews/types";

export function RatingSummary({ stats }: { stats: ReviewStats }) {
  const maxCount = Math.max(...Object.values(stats.breakdown), 1);

  return (
    <section className="grid gap-6 rounded-2xl border border-border/60 bg-card p-6 shadow-subtle md:grid-cols-[auto_1fr] md:items-end">
      <section>
        <p className="text-4xl font-semibold tabular-nums text-foreground">
          {stats.totalReviews > 0 ? stats.averageRating.toFixed(1) : "—"}
        </p>
        <StarRating value={stats.averageRating} size="md" className="mt-2" />
        <p className="mt-2 text-sm text-muted-foreground">
          {stats.totalReviews} {stats.totalReviews === 1 ? "review" : "reviews"}
        </p>
      </section>
      {stats.totalReviews > 0 ? (
        <ul className="min-w-[200px] space-y-2">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const count = stats.breakdown[star];
            const pct = Math.round((count / maxCount) * 100);
            return (
              <li key={star} className="flex items-center gap-2 text-sm">
                <span className="w-8 tabular-nums text-muted-foreground">{star}★</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-amber-400 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="w-8 text-right tabular-nums text-muted-foreground">{count}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
