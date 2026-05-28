import "server-only";

import {
  ContractStatus,
  FilePurpose,
  ReviewStatus,
  Role
} from "@prisma/client";

import { prisma } from "@/lib/db";

export async function getFreelancerPublicDetail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      role: true,
      verifiedAt: true,
      imageFileId: true,
      freelancerProfile: {
        select: {
          id: true,
          headline: true,
          bio: true,
          hourlyRate: true,
          availability: true,
          categorySlugs: true,
          isPublic: true,
          ratingAverage: true,
          ratingCount: true,
          skills: {
            include: { skill: { select: { id: true, name: true, slug: true } } }
          }
        }
      }
    }
  });

  if (!user || user.role !== Role.FREELANCER || !user.freelancerProfile?.isPublic) {
    return null;
  }

  const fp = user.freelancerProfile;

  const [portfolioItems, reviews, completedContracts] = await Promise.all([
    prisma.portfolioItem.findMany({
      where: { freelancerProfileId: fp.id },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        projectUrl: true,
        imageFileId: true
      }
    }),
    prisma.review.findMany({
      where: {
        subjectUserId: userId,
        status: ReviewStatus.APPROVED,
        subject: "CLIENT_TO_FREELANCER"
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        authorUser: { select: { name: true } },
        project: { select: { title: true } }
      }
    }),
    prisma.contract.findMany({
      where: {
        status: ContractStatus.COMPLETED,
        proposal: { freelancer: { userId } }
      },
      orderBy: { completedAt: "desc" },
      take: 12,
      select: {
        id: true,
        agreedAmount: true,
        currency: true,
        completedAt: true,
        project: { select: { id: true, title: true } }
      }
    })
  ]);

  return {
    user: {
      id: user.id,
      name: user.name,
      verified: !!user.verifiedAt,
      imageUrl: user.imageFileId ? `/api/uploads/${user.imageFileId}` : null
    },
    profile: {
      headline: fp.headline,
      bio: fp.bio,
      hourlyRate: fp.hourlyRate?.toString() ?? null,
      availability: fp.availability,
      categorySlugs: fp.categorySlugs,
      ratingAverage: fp.ratingAverage.toString(),
      ratingCount: fp.ratingCount,
      skills: fp.skills.map((s) => s.skill)
    },
    portfolio: portfolioItems.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      projectUrl: p.projectUrl,
      imageUrl: p.imageFileId ? `/api/uploads/${p.imageFileId}` : null
    })),
    reviews,
    completedContracts: completedContracts.map((c) => ({
      id: c.id,
      projectId: c.project.id,
      projectTitle: c.project.title,
      agreedAmount: c.agreedAmount.toString(),
      currency: c.currency,
      completedAt: c.completedAt
    }))
  };
}

export async function getProfileForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      imageFileId: true,
      freelancerProfile: {
        include: {
          skills: { include: { skill: { select: { id: true, name: true, slug: true } } } }
        }
      },
      clientProfile: true
    }
  });

  if (!user) return null;

  const portfolio =
    user.role === Role.FREELANCER && user.freelancerProfile
      ? await prisma.portfolioItem.findMany({
          where: { freelancerProfileId: user.freelancerProfile.id },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            projectUrl: true,
            imageFileId: true
          }
        }).then((rows) =>
          rows.map((p) => ({
            id: p.id,
            title: p.title,
            description: p.description,
            projectUrl: p.projectUrl,
            imageUrl: p.imageFileId ? `/api/uploads/${p.imageFileId}` : null
          }))
        )
      : [];

  return {
    ...user,
    imageUrl: user.imageFileId ? `/api/uploads/${user.imageFileId}` : null,
    portfolio
  };
}
