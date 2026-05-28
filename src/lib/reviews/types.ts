import type { ReviewSubject } from "@prisma/client";

export type ReviewStats = {
  averageRating: number;
  totalReviews: number;
  breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
};

export type PublicReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  subject: ReviewSubject;
  authorName: string;
  projectTitle: string;
  createdAt: string;
};

export type ReviewEligibility = {
  canReview: boolean;
  reason?: string;
  direction?: ReviewSubject;
  reviewedUserId?: string;
  reviewedUserName?: string;
  existingReviewId?: string;
  existingStatus?: string;
};
