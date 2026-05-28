import { z } from "zod";

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  headline: z.string().trim().max(120).optional().or(z.literal("")),
  bio: z.string().trim().max(4000).optional().or(z.literal("")),
  hourlyRate: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  availability: z.enum(["AVAILABLE", "LIMITED", "UNAVAILABLE"]).optional(),
  companyName: z.string().trim().max(120).optional().or(z.literal("")),
  websiteUrl: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^https?:\/\/.+/i.test(v), "Enter a valid URL"),
  categorySlugs: z.array(z.string()).max(8).optional(),
  skillIds: z.array(z.string()).max(24).optional(),
  isPublic: z.boolean().optional()
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
