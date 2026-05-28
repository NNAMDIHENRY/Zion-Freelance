import "server-only";

import { JobStatus, type Prisma, type SalaryType, type WorkMode, type EmploymentType, type ExperienceLevel } from "@prisma/client";

import { prisma } from "@/lib/db";
import { buildJobOrderBy, buildPublicJobWhere } from "@/lib/jobs/search/query-builder";
import type { JobSearchContext, JobSearchRow, PaginatedJobs } from "@/lib/jobs/search/types";

const jobListSelect = {
  id: true,
  slug: true,
  title: true,
  shortDescription: true,
  companyName: true,
  workMode: true,
  employmentType: true,
  experienceLevel: true,
  salaryMin: true,
  salaryMax: true,
  salaryType: true,
  currency: true,
  city: true,
  country: true,
  featured: true,
  urgentHiring: true,
  verifiedEmployerBadge: true,
  applicationDeadline: true,
  publishedAt: true,
  createdAt: true,
  category: { select: { name: true } },
  skills: { take: 8, include: { skill: { select: { name: true } } } }
} as const;

type JobListRow = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  companyName: string;
  workMode: WorkMode;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  salaryMin: Prisma.Decimal | null;
  salaryMax: Prisma.Decimal | null;
  salaryType: SalaryType | null;
  currency: string;
  city: string | null;
  country: string | null;
  featured: boolean;
  urgentHiring: boolean;
  verifiedEmployerBadge: boolean;
  applicationDeadline: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  category: { name: string };
  skills: { skill: { name: string } }[];
};

function mapRow(r: JobListRow): JobSearchRow {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    shortDescription: r.shortDescription,
    companyName: r.companyName,
    workMode: r.workMode,
    employmentType: r.employmentType,
    experienceLevel: r.experienceLevel,
    salaryMin: r.salaryMin?.toString() ?? null,
    salaryMax: r.salaryMax?.toString() ?? null,
    salaryType: r.salaryType,
    currency: r.currency,
    city: r.city,
    country: r.country,
    categoryName: r.category.name,
    skills: r.skills.map((s) => s.skill.name),
    featured: r.featured,
    urgentHiring: r.urgentHiring,
    verifiedEmployerBadge: r.verifiedEmployerBadge,
    applicationDeadline: r.applicationDeadline?.toISOString() ?? null,
    publishedAt: r.publishedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString()
  };
}

export async function searchJobs(ctx: JobSearchContext): Promise<PaginatedJobs<JobSearchRow>> {
  const where = buildPublicJobWhere(ctx);
  const orderBy = buildJobOrderBy(ctx.sort);
  const skip = (ctx.page - 1) * ctx.pageSize;

  const [total, rows] = await Promise.all([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      orderBy,
      skip,
      take: ctx.pageSize,
      select: jobListSelect
    })
  ]);

  return {
    items: rows.map(mapRow),
    total,
    page: ctx.page,
    pageSize: ctx.pageSize,
    totalPages: Math.max(1, Math.ceil(total / ctx.pageSize))
  };
}

export async function getFeaturedJobs(limit = 6) {
  const rows = await prisma.job.findMany({
    where: { status: JobStatus.ACTIVE, featured: true },
    orderBy: [{ publishedAt: "desc" }],
    take: limit,
    select: jobListSelect
  });
  return rows.map(mapRow);
}

export async function getLatestJobs(limit = 8) {
  const rows = await prisma.job.findMany({
    where: { status: JobStatus.ACTIVE },
    orderBy: [{ publishedAt: "desc" }],
    take: limit,
    select: jobListSelect
  });
  return rows.map(mapRow);
}

export async function getPopularJobCategories(limit = 8) {
  const groups = await prisma.job.groupBy({
    by: ["categoryId"],
    where: { status: JobStatus.ACTIVE },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit
  });
  if (!groups.length) return [];
  const cats = await prisma.jobCategory.findMany({
    where: { id: { in: groups.map((g) => g.categoryId) } },
    select: { id: true, name: true, slug: true }
  });
  const countMap = new Map(groups.map((g) => [g.categoryId, g._count.id]));
  return cats.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    jobCount: countMap.get(c.id) ?? 0
  }));
}

export async function getRelatedJobs(jobId: string, categoryId: string, limit = 4) {
  const rows = await prisma.job.findMany({
    where: {
      status: JobStatus.ACTIVE,
      categoryId,
      NOT: { id: jobId }
    },
    orderBy: [{ publishedAt: "desc" }],
    take: limit,
    select: jobListSelect
  });
  return rows.map(mapRow);
}
