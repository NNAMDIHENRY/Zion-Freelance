import "server-only";

import { prisma } from "@/lib/db";

export async function getClientProfileIdForUser(userId: string) {
  const profile = await prisma.clientProfile.findUnique({
    where: { userId },
    select: { id: true }
  });
  return profile?.id ?? null;
}

export async function getFreelancerProfileIdForUser(userId: string) {
  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId },
    select: { id: true }
  });
  return profile?.id ?? null;
}

export async function listTaxonomyOptions() {
  const [categories, skills] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true }
    }),
    prisma.skill.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true }
    })
  ]);
  return { categories, skills };
}

export async function listProjectsForClient(clientProfileId: string) {
  return prisma.project.findMany({
    where: { clientId: clientProfileId },
    orderBy: { updatedAt: "desc" },
    include: {
      category: { select: { name: true } },
      skills: { include: { skill: { select: { name: true } } } },
      _count: { select: { attachments: true } }
    }
  });
}

export async function getProjectOwnedByClient(projectId: string, clientProfileId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, clientId: clientProfileId },
    include: {
      category: true,
      skills: { include: { skill: true } },
      attachments: { orderBy: { createdAt: "desc" } },
      _count: { select: { proposals: true } }
    }
  });
}
