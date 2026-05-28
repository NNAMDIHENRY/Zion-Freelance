import { z } from "zod";

export const milestoneInputSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  amount: z.coerce.number().positive(),
  dueDate: z.coerce.date().optional().nullable()
});

export const setupMilestonesSchema = z.object({
  milestones: z.array(milestoneInputSchema).min(1).max(20)
});

export type MilestoneInput = z.infer<typeof milestoneInputSchema>;
export type SetupMilestonesInput = z.infer<typeof setupMilestonesSchema>;
