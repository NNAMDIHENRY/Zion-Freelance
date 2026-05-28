import { z } from "zod";

export const portfolioItemSchema = z.object({
  title: z.string().trim().min(2, "Title is required").max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  projectUrl: z
    .string()
    .trim()
    .url("Enter a valid URL")
    .max(512)
    .optional()
    .or(z.literal(""))
});
