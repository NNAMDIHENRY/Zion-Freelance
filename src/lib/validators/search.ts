import { z } from "zod";

import {
  DEFAULT_PAGE_SIZE,
  FREELANCER_SORTS,
  MAX_PAGE_SIZE,
  PROJECT_SORTS
} from "@/lib/search/constants";

const page = z.coerce.number().int().min(1).default(1);
const pageSize = z.coerce
  .number()
  .int()
  .min(1)
  .max(MAX_PAGE_SIZE)
  .default(DEFAULT_PAGE_SIZE);

const optionalId = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() ? v.trim() : undefined));

const skillIds = z
  .string()
  .optional()
  .transform((v) =>
    v
      ? v
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : []
  );

const money = z.coerce.number().nonnegative().optional();

export const freelancerSearchSchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: optionalId,
  skills: skillIds,
  budgetPreset: z.string().optional(),
  budgetMin: money,
  budgetMax: money,
  ratingMin: z.coerce.number().min(0).max(5).optional(),
  sort: z.enum(FREELANCER_SORTS).default("rating"),
  page,
  pageSize
});

export const projectSearchSchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: optionalId,
  skills: skillIds,
  budgetPreset: z.string().optional(),
  budgetMin: money,
  budgetMax: money,
  sort: z.enum(PROJECT_SORTS).default("newest"),
  page,
  pageSize
});

export type FreelancerSearchParams = z.infer<typeof freelancerSearchSchema>;
export type ProjectSearchParams = z.infer<typeof projectSearchSchema>;
