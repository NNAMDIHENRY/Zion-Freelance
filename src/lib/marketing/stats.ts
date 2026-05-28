import "server-only";

import { ContractStatus, ProjectModerationStatus, ProjectStatus } from "@prisma/client";

import { prisma } from "@/lib/db";

export async function getMarketingStats() {
  const [
    freelancers,
    clients,
    openProjects,
    activeProjects,
    completedProjects,
    verifiedUsers,
    completedContracts,
    avgRating
  ] = await Promise.all([
    prisma.freelancerProfile.count({ where: { isPublic: true } }),
    prisma.clientProfile.count(),
    prisma.project.count({
      where: {
        status: ProjectStatus.OPEN,
        moderationStatus: ProjectModerationStatus.ACTIVE
      }
    }),
    prisma.project.count({
      where: {
        status: { in: [ProjectStatus.OPEN, ProjectStatus.IN_PROGRESS] },
        moderationStatus: ProjectModerationStatus.ACTIVE
      }
    }),
    prisma.project.count({ where: { status: ProjectStatus.COMPLETED } }),
    prisma.user.count({ where: { verifiedAt: { not: null } } }),
    prisma.contract.count({ where: { status: ContractStatus.COMPLETED } }),
    prisma.freelancerProfile.aggregate({
      _avg: { ratingAverage: true },
      where: { ratingCount: { gt: 0 }, isPublic: true }
    })
  ]);

  const rating = avgRating._avg.ratingAverage
    ? Number(avgRating._avg.ratingAverage.toString()).toFixed(1)
    : "4.8";

  return {
    freelancers,
    clients,
    openProjects,
    activeProjects,
    completedProjects,
    verifiedUsers,
    completedContracts,
    avgRating: rating
  };
}

export async function getFeaturedFreelancers(limit = 4) {
  const rows = await prisma.freelancerProfile.findMany({
    where: { isPublic: true },
    orderBy: [
      { planTier: "desc" },
      { ratingAverage: "desc" },
      { ratingCount: "desc" }
    ],
    take: limit,
    select: {
      id: true,
      userId: true,
      headline: true,
      hourlyRate: true,
      planTier: true,
      user: { select: { name: true, verifiedAt: true, imageFileId: true } },
      skills: { take: 3, include: { skill: { select: { name: true } } } }
    }
  });

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    name: r.user.name,
    headline: r.headline ?? "Freelancer",
    hourlyRate: r.hourlyRate ? `$${Number(r.hourlyRate)}/hr` : "Rate on request",
    metric: r.skills.map((s) => s.skill.name).join(" · ") || "Professional services",
    verified: !!r.user.verifiedAt,
    planTier: r.planTier,
    imageUrl: r.user.imageFileId ? `/api/uploads/${r.user.imageFileId}` : null
  }));
}
