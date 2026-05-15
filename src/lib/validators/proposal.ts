import { z } from "zod";

const money = z.coerce
  .number()
  .positive("Price must be greater than zero")
  .max(1_000_000_000, "Price is too large");

export const proposalWriteSchema = z.object({
  proposedPrice: money,
  coverLetter: z
    .string()
    .trim()
    .min(40, "Cover letter must be at least 40 characters")
    .max(12_000, "Cover letter is too long"),
  deliveryDays: z.coerce
    .number()
    .int()
    .min(1, "Delivery must be at least 1 day")
    .max(730, "Delivery cannot exceed 730 days")
});

export type ProposalWriteInput = z.infer<typeof proposalWriteSchema>;
