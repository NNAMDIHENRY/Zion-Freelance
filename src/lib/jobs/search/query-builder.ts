import "server-only";

import { JobStatus, Prisma } from "@prisma/client";

import type { JobSearchContext } from "@/lib/jobs/search/types";

export function buildPublicJobWhere(ctx: JobSearchContext): Prisma.JobWhereInput {
  const and: Prisma.JobWhereInput[] = [{ status: JobStatus.ACTIVE }];

  if (ctx.q?.trim()) {
    const q = ctx.q.trim();
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { shortDescription: { contains: q, mode: "insensitive" } },
        { companyName: { contains: q, mode: "insensitive" } },
        { skills: { some: { skill: { name: { contains: q, mode: "insensitive" } } } } }
      ]
    });
  }

  if (ctx.categoryId) and.push({ categoryId: ctx.categoryId });
  if (ctx.categorySlug) and.push({ category: { slug: ctx.categorySlug } });
  if (ctx.workMode) and.push({ workMode: ctx.workMode });
  if (ctx.employmentType) and.push({ employmentType: ctx.employmentType });
  if (ctx.experienceLevel) and.push({ experienceLevel: ctx.experienceLevel });
  if (ctx.country?.trim()) and.push({ country: { equals: ctx.country.trim(), mode: "insensitive" } });
  if (ctx.city?.trim()) and.push({ city: { contains: ctx.city.trim(), mode: "insensitive" } });
  if (ctx.featured) and.push({ featured: true });
  if (ctx.urgent) and.push({ urgentHiring: true });
  if (ctx.salaryMin != null) {
    and.push({
      OR: [{ salaryMax: { gte: ctx.salaryMin } }, { salaryMin: { gte: ctx.salaryMin } }]
    });
  }
  if (ctx.salaryMax != null) {
    and.push({
      OR: [{ salaryMin: { lte: ctx.salaryMax } }, { salaryMax: { lte: ctx.salaryMax } }]
    });
  }
  if (ctx.postedWithinDays) {
    const since = new Date();
    since.setDate(since.getDate() - ctx.postedWithinDays);
    and.push({ publishedAt: { gte: since } });
  }

  return { AND: and };
}

export function buildJobOrderBy(
  sort: JobSearchContext["sort"]
): Prisma.JobOrderByWithRelationInput[] {
  switch (sort) {
    case "oldest":
      return [{ publishedAt: "asc" }];
    case "salary_desc":
      return [{ salaryMax: "desc" }, { publishedAt: "desc" }];
    case "salary_asc":
      return [{ salaryMin: "asc" }, { publishedAt: "desc" }];
    case "deadline":
      return [{ applicationDeadline: "asc" }, { publishedAt: "desc" }];
    default:
      return [{ featured: "desc" }, { publishedAt: "desc" }];
  }
}
