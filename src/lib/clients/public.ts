import "server-only";

import { ProjectStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { budgetLabel } from "@/lib/projects/formatting";

export async function getPublicClientProfile(userId: string) {
  const profile = await prisma.clientProfile.findFirst({
    where: { userId, isPublic: true },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          verifiedAt: true,
          imageFileId: true,
          createdAt: true
        }
      },
      projects: {
        orderBy: { updatedAt: "desc" },
        take: 40,
        select: {
          id: true,
          title: true,
          status: true,
          budgetMin: true,
          budgetMax: true,
          currency: true,
          createdAt: true
        }
      },
      _count: { select: { projects: true } }
    }
  });

  if (!profile) return null;

  const byStatus = (status: ProjectStatus) =>
    profile.projects.filter((p) => p.status === status);

  return {
    userId: profile.user.id,
    name: profile.user.name,
    verified: !!profile.user.verifiedAt,
    imageUrl: profile.user.imageFileId ? `/api/uploads/${profile.user.imageFileId}` : null,
    memberSince: profile.user.createdAt,
    companyName: profile.companyName,
    websiteUrl: profile.websiteUrl,
    bio: profile.bio,
    profileViewCount: profile.profileViewCount,
    stats: {
      total: profile._count.projects,
      active: profile.projects.filter(
        (p) => p.status === ProjectStatus.OPEN || p.status === ProjectStatus.IN_PROGRESS
      ).length,
      completed: byStatus(ProjectStatus.COMPLETED).length,
      pending: byStatus(ProjectStatus.DRAFT).length,
      closed: byStatus(ProjectStatus.CLOSED).length,
      cancelled: byStatus(ProjectStatus.CANCELLED).length
    },
    projects: profile.projects.map((p) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      budgetLabel: budgetLabel(p.budgetMin, p.budgetMax, p.currency),
      createdAt: p.createdAt
    }))
  };
}
