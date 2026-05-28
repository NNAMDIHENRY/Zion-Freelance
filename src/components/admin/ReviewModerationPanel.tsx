"use client";

import { ReviewStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { StarRating } from "@/components/reviews/StarRating";
import { Button } from "@/components/ui/button";
import { moderateReviewAction } from "@/lib/reviews/actions";
import type { AdminReviewRow } from "@/lib/reviews/service";

const STATUS_LABEL: Record<ReviewStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected"
};

export function ReviewModerationPanel({ items }: { items: AdminReviewRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function act(reviewId: string, action: "approve" | "reject" | "delete") {
    startTransition(async () => {
      const res = await moderateReviewAction({ reviewId, action });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(action === "delete" ? "Review deleted" : `Review ${action}d`);
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-border/60 bg-card p-8 text-center text-sm text-muted-foreground">
        No reviews in this queue.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {items.map((row) => (
        <li
          key={row.id}
          className="rounded-2xl border border-border/60 bg-card p-5 shadow-subtle"
        >
          <header className="flex flex-wrap items-start justify-between gap-3">
            <section className="min-w-0 space-y-1 text-sm">
              <p>
                <span className="font-medium text-foreground">{row.authorName}</span>
                <span className="text-muted-foreground"> → </span>
                <span className="font-medium text-foreground">{row.subjectUserName}</span>
              </p>
              <p className="text-muted-foreground">{row.projectTitle}</p>
              <p className="text-xs text-muted-foreground">
                {row.subject.replace(/_/g, " ").toLowerCase()} ·{" "}
                {new Date(row.createdAt).toLocaleString()}
              </p>
            </section>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
              {STATUS_LABEL[row.status]}
            </span>
          </header>
          <StarRating value={row.rating} size="sm" className="mt-3" />
          {row.comment ? (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{row.comment}</p>
          ) : null}
          <footer className="mt-4 flex flex-wrap gap-2">
            {row.status !== ReviewStatus.APPROVED ? (
              <Button
                size="sm"
                disabled={pending}
                onClick={() => act(row.id, "approve")}
              >
                Approve
              </Button>
            ) : null}
            {row.status !== ReviewStatus.REJECTED ? (
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => act(row.id, "reject")}
              >
                Reject
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              className="text-destructive hover:text-destructive"
              onClick={() => act(row.id, "delete")}
            >
              Delete
            </Button>
          </footer>
        </li>
      ))}
    </ul>
  );
}
