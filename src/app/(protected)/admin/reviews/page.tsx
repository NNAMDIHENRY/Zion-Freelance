import { ReviewStatus, Role } from "@prisma/client";
import Link from "next/link";

import { ReviewModerationPanel } from "@/components/admin/ReviewModerationPanel";
import { requireRole } from "@/lib/auth/guard";
import { listReviewsForModeration } from "@/lib/reviews/service";

const TABS: { label: string; status?: ReviewStatus }[] = [
  { label: "Pending", status: ReviewStatus.PENDING },
  { label: "Approved", status: ReviewStatus.APPROVED },
  { label: "Rejected", status: ReviewStatus.REJECTED },
  { label: "All" }
];

export default async function AdminReviewsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await requireRole([Role.ADMIN]);
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const statusParam = sp.status?.toUpperCase();
  const statusFilter =
    statusParam === "ALL"
      ? undefined
      : statusParam && Object.values(ReviewStatus).includes(statusParam as ReviewStatus)
        ? (statusParam as ReviewStatus)
        : ReviewStatus.PENDING;

  const result = await listReviewsForModeration(page, 20, statusFilter);

  return (
    <main className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">
          <Link href="/admin" className="text-primary hover:underline">
            Admin
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Reviews</span>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Review moderation</h1>
        <p className="text-sm text-muted-foreground">
          Approve reviews before they appear on public profiles and affect ratings.
        </p>
      </header>

      <nav className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const active =
            (tab.status === undefined && statusFilter === undefined) ||
            tab.status === statusFilter;
          const href =
            tab.status === undefined
              ? "/admin/reviews?status=all"
              : `/admin/reviews?status=${tab.status.toLowerCase()}`;
          return (
            <Link
              key={tab.label}
              href={href}
              className={
                active
                  ? "rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                  : "rounded-full border border-border/60 px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <ReviewModerationPanel items={result.items} />

      {result.totalPages > 1 ? (
        <p className="text-center text-sm text-muted-foreground">
          Page {result.page} of {result.totalPages} ({result.total} total)
        </p>
      ) : null}
    </main>
  );
}
