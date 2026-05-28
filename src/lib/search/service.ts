import "server-only";

import { prisma } from "@/lib/db";
import { budgetLabel } from "@/lib/projects/formatting";
import {
  buildFreelancerOrderBy,
  buildFreelancerWhere,
  buildProjectOrderBy,
  buildProjectWhere,
  type FreelancerQueryContext,
  type ProjectQueryContext
} from "@/lib/search/query-builder";
import type { FreelancerSearchRow, PaginatedResult, ProjectSearchRow } from "@/lib/search/types";

const freelancerSelect = {
  id: true,
  userId: true,
  headline: true,
  bio: true,
  hourlyRate: true,
  planTier: true,
  ratingAverage: true,
  ratingCount: true,
  user: { select: { name: true, verifiedAt: true } },
  skills: {
    take: 8,
    include: { skill: { select: { name: true } } }
  }
} as const;

const projectSelect = {
  id: true,
  title: true,
  description: true,
  budgetMin: true,
  budgetMax: true,
  currency: true,
  deadline: true,
  createdAt: true,
  category: { select: { name: true } },
  skills: {
    take: 10,
    include: { skill: { select: { name: true } } }
  }
} as const;

async function resolveCategoryName(categoryId?: string) {
  if (!categoryId) return undefined;
  const cat = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { name: true }
  });
  return cat?.name;
}

export async function searchFreelancers(
  input: FreelancerQueryContext
): Promise<PaginatedResult<FreelancerSearchRow>> {
  const categoryName = await resolveCategoryName(input.category);
  const where = buildFreelancerWhere({ ...input, categoryName });
  const orderBy = buildFreelancerOrderBy(input.sort);
  const skip = (input.page - 1) * input.pageSize;

  const [total, rows] = await Promise.all([
    prisma.freelancerProfile.count({ where }),
    prisma.freelancerProfile.findMany({
      where,
      orderBy,
      skip,
      take: input.pageSize,
      select: freelancerSelect
    })
  ]);

  const items: FreelancerSearchRow[] = rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    name: r.user.name,
    headline: r.headline,
    bioPreview: r.bio ? (r.bio.length > 160 ? `${r.bio.slice(0, 157)}…` : r.bio) : null,
    hourlyRate: r.hourlyRate?.toString() ?? null,
    ratingAverage: r.ratingAverage.toString(),
    ratingCount: r.ratingCount,
    planTier: r.planTier,
    verified: !!r.user.verifiedAt,
    skills: r.skills.map((s) => s.skill.name)
  }));

  return {
    items,
    total,
    page: input.page,
    pageSize: input.pageSize,
    totalPages: Math.max(1, Math.ceil(total / input.pageSize))
  };
}

export async function searchProjects(
  input: ProjectQueryContext
): Promise<PaginatedResult<ProjectSearchRow>> {
  const where = buildProjectWhere(input);
  const orderBy = buildProjectOrderBy(input.sort);
  const skip = (input.page - 1) * input.pageSize;

  const [total, rows] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      orderBy,
      skip,
      take: input.pageSize,
      select: projectSelect
    })
  ]);

  const items: ProjectSearchRow[] = rows.map((p) => ({
    id: p.id,
    title: p.title,
    descriptionPreview:
      p.description.length > 200 ? `${p.description.slice(0, 197)}…` : p.description,
    category: p.category?.name ?? null,
    budgetLabel: budgetLabel(p.budgetMin, p.budgetMax, p.currency),
    deadline: p.deadline?.toISOString() ?? null,
    skillNames: p.skills.map((s) => s.skill.name),
    createdAt: p.createdAt.toISOString()
  }));

  return {
    items,
    total,
    page: input.page,
    pageSize: input.pageSize,
    totalPages: Math.max(1, Math.ceil(total / input.pageSize))
  };
}
