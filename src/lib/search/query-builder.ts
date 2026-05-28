import type { Prisma } from "@prisma/client";
import { ProjectModerationStatus, ProjectStatus } from "@prisma/client";

import type { FreelancerSort, ProjectSort } from "@/lib/search/constants";
import type { FreelancerSearchParams, ProjectSearchParams } from "@/lib/validators/search";

export type FreelancerQueryContext = FreelancerSearchParams & {
  budgetMin?: number;
  budgetMax?: number;
  categoryName?: string;
};

export type ProjectQueryContext = ProjectSearchParams & {
  budgetMin?: number;
  budgetMax?: number;
  excludeClientUserId?: string;
};

export function buildFreelancerWhere(
  input: FreelancerQueryContext
): Prisma.FreelancerProfileWhereInput {
  const and: Prisma.FreelancerProfileWhereInput[] = [{ isPublic: true }];

  if (input.q) {
    const q = input.q;
    and.push({
      OR: [
        { user: { name: { contains: q, mode: "insensitive" } } },
        { headline: { contains: q, mode: "insensitive" } },
        { bio: { contains: q, mode: "insensitive" } },
        { skills: { some: { skill: { name: { contains: q, mode: "insensitive" } } } } }
      ]
    });
  }

  if (input.category) {
    const catOr: Prisma.FreelancerProfileWhereInput[] = [
      { proposals: { some: { project: { categoryId: input.category } } } }
    ];
    if (input.categoryName) {
      catOr.push(
        { headline: { contains: input.categoryName, mode: "insensitive" } },
        { bio: { contains: input.categoryName, mode: "insensitive" } }
      );
    }
    and.push({ OR: catOr });
  }

  if (input.skills.length) {
    and.push({
      OR: input.skills.map((skillId) => ({
        skills: { some: { skillId } }
      }))
    });
  }

  if (input.budgetMin !== undefined) {
    and.push({ hourlyRate: { gte: input.budgetMin } });
  }
  if (input.budgetMax !== undefined) {
    and.push({ hourlyRate: { lte: input.budgetMax } });
  }

  if (input.ratingMin !== undefined) {
    and.push({ ratingAverage: { gte: input.ratingMin } });
  }

  return { AND: and };
}

export function buildFreelancerOrderBy(sort: FreelancerSort): Prisma.FreelancerProfileOrderByWithRelationInput[] {
  const planBoost: Prisma.FreelancerProfileOrderByWithRelationInput = { planTier: "desc" };
  const verifiedBoost: Prisma.FreelancerProfileOrderByWithRelationInput = {
    user: { verifiedAt: "desc" }
  };
  switch (sort) {
    case "newest":
      return [verifiedBoost, planBoost, { createdAt: "desc" }];
    case "reviews":
      return [verifiedBoost, planBoost, { ratingCount: "desc" }, { ratingAverage: "desc" }];
    case "rating":
    default:
      return [verifiedBoost, planBoost, { ratingAverage: "desc" }, { ratingCount: "desc" }];
  }
}

export function buildProjectWhere(input: ProjectQueryContext): Prisma.ProjectWhereInput {
  const and: Prisma.ProjectWhereInput[] = [
    { status: ProjectStatus.OPEN },
    { moderationStatus: ProjectModerationStatus.ACTIVE }
  ];

  if (input.excludeClientUserId) {
    and.push({ client: { userId: { not: input.excludeClientUserId } } });
  }

  if (input.q) {
    const q = input.q;
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { skills: { some: { skill: { name: { contains: q, mode: "insensitive" } } } } }
      ]
    });
  }

  if (input.category) {
    and.push({ categoryId: input.category });
  }

  if (input.skills.length) {
    and.push({
      OR: input.skills.map((skillId) => ({
        skills: { some: { skillId } }
      }))
    });
  }

  if (input.budgetMin !== undefined) {
    and.push({
      OR: [{ budgetMax: { gte: input.budgetMin } }, { budgetMin: { gte: input.budgetMin } }]
    });
  }
  if (input.budgetMax !== undefined) {
    and.push({
      OR: [{ budgetMin: { lte: input.budgetMax } }, { budgetMax: { lte: input.budgetMax } }]
    });
  }

  return { AND: and };
}

export function buildProjectOrderBy(sort: ProjectSort): Prisma.ProjectOrderByWithRelationInput[] {
  switch (sort) {
    case "budget":
      return [{ budgetMax: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }];
    case "deadline":
      return [{ deadline: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }];
    case "newest":
    default:
      return [{ createdAt: "desc" }];
  }
}
