import { ProjectStatus } from "@prisma/client";
import { z } from "zod";

const CLIENT_STATUSES: ProjectStatus[] = [
  ProjectStatus.DRAFT,
  ProjectStatus.OPEN,
  ProjectStatus.IN_PROGRESS,
  ProjectStatus.COMPLETED,
  ProjectStatus.CANCELLED
];

const money = z
  .string()
  .trim()
  .min(1, "Required")
  .refine((v) => Number.isFinite(Number(v)) && Number(v) >= 0, "Invalid amount");

const budgetMaxField = z
  .string()
  .optional()
  .transform((v) => (v == null || v.trim() === "" ? undefined : v.trim()))
  .refine((v) => v === undefined || (Number.isFinite(Number(v)) && Number(v) >= 0), "Invalid amount");

export const projectWriteBaseSchema = z
  .object({
    title: z.string().trim().min(3).max(200),
    description: z.string().trim().min(10).max(20000),
    categoryId: z.string().cuid("Pick a category"),
    skillIds: z.array(z.string().cuid()).min(1).max(24),
    budgetMin: money,
    budgetMax: budgetMaxField,
    budgetIsRange: z.boolean().optional().default(false),
    deadline: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v === "" || !v ? undefined : v))
      .refine((v) => {
        if (!v) return true;
        const d = new Date(v);
        return !Number.isNaN(d.getTime());
      }, "Invalid date"),
    status: z.nativeEnum(ProjectStatus)
  })
  .superRefine((data, ctx) => {
    if (!CLIENT_STATUSES.includes(data.status) && data.status !== ProjectStatus.CLOSED) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid status", path: ["status"] });
    }
    const min = Number(data.budgetMin);
    const max = data.budgetMax !== undefined ? Number(data.budgetMax) : undefined;
    if (data.budgetIsRange) {
      if (max === undefined || Number.isNaN(max)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Max budget required for a range",
          path: ["budgetMax"]
        });
        return;
      }
      if (max < min) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Max must be ≥ min",
          path: ["budgetMax"]
        });
      }
    } else if (max !== undefined && !Number.isNaN(max) && max < min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Max must be ≥ min",
        path: ["budgetMax"]
      });
    }
  });

export type ProjectWriteInput = z.infer<typeof projectWriteBaseSchema>;
export type ProjectWritePayload = z.input<typeof projectWriteBaseSchema>;
