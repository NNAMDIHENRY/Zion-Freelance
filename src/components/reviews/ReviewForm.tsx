"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { StarRating } from "@/components/reviews/StarRating";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createReviewAction } from "@/lib/reviews/actions";
import type { ReviewEligibility } from "@/lib/reviews/types";

type ReviewFormProps = {
  contractId: string;
  eligibility: ReviewEligibility;
};

export function ReviewForm({ contractId, eligibility }: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [pending, startTransition] = useTransition();

  if (!eligibility.canReview) {
    if (eligibility.existingReviewId) {
      return (
        <p className="text-sm text-muted-foreground">
          Your review is{" "}
          <span className="font-medium text-foreground">
            {eligibility.existingStatus?.toLowerCase() ?? "submitted"}
          </span>
          . It will appear on their profile after moderation.
        </p>
      );
    }
    if (eligibility.reason) {
      return <p className="text-sm text-muted-foreground">{eligibility.reason}</p>;
    }
    return null;
  }

  const reviewedName = eligibility.reviewedUserName ?? "your partner";

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await createReviewAction({
            contractId,
            rating,
            comment: comment || null
          });
          if (!res.ok) {
            toast.error(res.error);
            return;
          }
          toast.success("Review submitted for moderation");
          setComment("");
          router.refresh();
        });
      }}
    >
      <p className="text-sm text-muted-foreground">
        Rate <span className="font-medium text-foreground">{reviewedName}</span> for this
        completed contract. Reviews are published after admin approval.
      </p>
      <fieldset className="space-y-2 border-0 p-0">
        <Label>Rating</Label>
        <StarRating mode="input" value={rating} onChange={setRating} />
      </fieldset>
      <fieldset className="space-y-2 border-0 p-0">
        <Label htmlFor="review-comment">Comment (optional)</Label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Share your experience working together…"
        />
      </fieldset>
      <Button type="submit" disabled={pending}>
        {pending ? "Submitting…" : "Submit review"}
      </Button>
    </form>
  );
}
