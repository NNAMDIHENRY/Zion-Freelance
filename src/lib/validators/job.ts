import {
  EmploymentType,
  ExperienceLevel,
  JobApplicationStatus,
  JobStatus,
  SalaryType,
  WorkMode
} from "@prisma/client";
import { z } from "zod";

const moneyString = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d+(\.\d{1,4})?$/.test(v), "Invalid amount");

export const jobWriteSchema = z
  .object({
    title: z.string().trim().min(5).max(200),
    shortDescription: z.string().trim().min(20).max(500),
    fullDescription: z.string().trim().min(50).max(50000),
    responsibilities: z.string().trim().max(20000).optional(),
    requirements: z.string().trim().max(20000).optional(),
    qualifications: z.string().trim().max(20000).optional(),
    benefits: z.string().trim().max(10000).optional(),
    salaryMin: moneyString.optional(),
    salaryMax: moneyString.optional(),
    salaryType: z.nativeEnum(SalaryType).optional(),
    currency: z.string().trim().length(3).default("USD"),
    experienceLevel: z.nativeEnum(ExperienceLevel),
    employmentType: z.nativeEnum(EmploymentType),
    workMode: z.nativeEnum(WorkMode),
    categoryId: z.string().cuid(),
    skillIds: z.array(z.string().cuid()).min(1).max(20),
    country: z.string().trim().max(100).optional(),
    stateProvince: z.string().trim().max(100).optional(),
    city: z.string().trim().max(100).optional(),
    fullAddress: z.string().trim().max(500).optional(),
    applicationUrl: z.string().url().max(500).optional().or(z.literal("")),
    applicationEmail: z.string().email().max(200).optional().or(z.literal("")),
    applicationDeadline: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z
        .string()
        .refine(
          (val) => !val || !isNaN(Date.parse(val)),
          "Invalid date"
        )
        .optional()
    ),
    vacancies: z.coerce.number().int().min(1).max(500).default(1),
    featured: z.boolean().optional(),
    urgentHiring: z.boolean().optional(),
    companyName: z.string().trim().min(2).max(200),
    companyWebsite: z.string().url().max(500).optional().or(z.literal("")),
    companySize: z.string().trim().max(100).optional(),
    industry: z.string().trim().max(100).optional(),
    yearsInOperation: z.coerce.number().int().min(0).max(200).optional(),
    status: z.nativeEnum(JobStatus),
    expiresAt: z.string().datetime().optional().or(z.literal(""))
  })
  .superRefine((d, ctx) => {
    const min = d.salaryMin && d.salaryMin !== "" ? Number(d.salaryMin) : null;
    const max = d.salaryMax && d.salaryMax !== "" ? Number(d.salaryMax) : null;
    if (min != null && max != null && min > max) {
      ctx.addIssue({ code: "custom", message: "Max salary must be >= min", path: ["salaryMax"] });
    }
    if (d.workMode !== WorkMode.REMOTE && !d.country?.trim()) {
      ctx.addIssue({ code: "custom", message: "Country required for onsite/hybrid", path: ["country"] });
    }
  });

export const jobApplicationWriteSchema = z.object({
  jobId: z.string().cuid(),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().email().max(200),
  phone: z.string().trim().max(40).optional(),
  coverLetter: z.string().trim().min(50).max(10000),
  portfolioUrl: z.string().url().max(500).optional().or(z.literal("")),
  linkedInUrl: z.string().url().max(500).optional().or(z.literal("")),
  githubUrl: z.string().url().max(500).optional().or(z.literal("")),
  yearsExperience: z.coerce.number().int().min(0).max(60).optional(),
  availability: z.string().trim().max(200).optional(),
  expectedSalary: moneyString.optional(),
  expectedSalaryType: z.nativeEnum(SalaryType).optional(),
  currency: z.string().trim().length(3).default("USD")
});

export const jobApplicationStatusSchema = z.object({
  applicationId: z.string().cuid(),
  status: z.nativeEnum(JobApplicationStatus)
});

export const jobSearchSchema = z.object({
  q: z.string().trim().max(200).optional(),
  categoryId: z.string().cuid().optional(),
  categorySlug: z.string().trim().max(80).optional(),
  workMode: z.nativeEnum(WorkMode).optional(),
  employmentType: z.nativeEnum(EmploymentType).optional(),
  experienceLevel: z.nativeEnum(ExperienceLevel).optional(),
  country: z.string().trim().max(100).optional(),
  city: z.string().trim().max(100).optional(),
  salaryMin: z.coerce.number().optional(),
  salaryMax: z.coerce.number().optional(),
  featured: z.coerce.boolean().optional(),
  urgent: z.coerce.boolean().optional(),
  postedWithinDays: z.coerce.number().int().min(1).max(365).optional(),
  sort: z.enum(["newest", "oldest", "salary_desc", "salary_asc", "deadline"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12)
});

export const jobReportSchema = z.object({
  jobId: z.string().cuid(),
  reason: z.string().trim().min(5).max(200),
  details: z.string().trim().max(2000).optional()
});

export const adminJobModerationSchema = z.object({
  jobId: z.string().cuid(),
  status: z.enum([JobStatus.ACTIVE, JobStatus.REJECTED, JobStatus.CLOSED]),
  moderationNote: z.string().trim().max(2000).optional(),
  featured: z.boolean().optional()
});
