import { z } from "zod";

export const createReviewSchema = z.object({
  contractId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(2000).optional().nullable()
});

export const moderateReviewSchema = z.object({
  reviewId: z.string().min(1),
  action: z.enum(["approve", "reject", "delete"])
});

export const reviewListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10)
});
