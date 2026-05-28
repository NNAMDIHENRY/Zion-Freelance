import "server-only";

import {
  ContractStatus,
  NotificationType,
  Prisma,
  ReviewStatus,
  ReviewSubject,
  Role
} from "@prisma/client";

import { prisma } from "@/lib/db";
import { sanitizeReviewComment } from "@/lib/reviews/sanitize";
import type { PublicReviewRow, ReviewEligibility, ReviewStats } from "@/lib/reviews/types";

export type ReviewServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code: ReviewServiceErrorCode };

export type ReviewServiceErrorCode =
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "CONFLICT"
  | "BAD_STATE";

function err(error: string, code: ReviewServiceErrorCode): ReviewServiceResult<never> {
  return { ok: false, error, code };
}

const approvedReviewSelect = {
  id: true,
  rating: true,
  comment: true,
  subject: true,
  createdAt: true,
  authorUser: { select: { name: true } },
  project: { select: { title: true } }
} as const;

type ContractParticipants = {
  contractId: string;
  projectId: string;
  projectTitle: string;
  status: ContractStatus;
  clientUserId: string;
  clientUserName: string;
  freelancerUserId: string;
  freelancerUserName: string;
  freelancerProfileId: string;
  clientProfileId: string;
};

async function loadContractParticipants(
  contractId: string
): Promise<ContractParticipants | null> {
  const row = await prisma.contract.findUnique({
    where: { id: contractId },
    select: {
      id: true,
      status: true,
      projectId: true,
      project: {
        select: {
          id: true,
          title: true,
          clientId: true,
          client: {
            select: {
              id: true,
              userId: true,
              user: { select: { name: true } }
            }
          }
        }
      },
      proposal: {
        select: {
          freelancer: {
            select: {
              id: true,
              userId: true,
              user: { select: { name: true } }
            }
          }
        }
      }
    }
  });
  if (!row) return null;

  return {
    contractId: row.id,
    projectId: row.projectId,
    projectTitle: row.project.title,
    status: row.status,
    clientUserId: row.project.client.userId,
    clientUserName: row.project.client.user.name,
    freelancerUserId: row.proposal.freelancer.userId,
    freelancerUserName: row.proposal.freelancer.user.name,
    freelancerProfileId: row.proposal.freelancer.id,
    clientProfileId: row.project.client.id
  };
}

function resolveDirection(
  role: Role,
  participants: ContractParticipants
): ReviewServiceResult<{ subject: ReviewSubject; subjectUserId: string; subjectUserName: string }> {
  if (role === Role.CLIENT) {
    return {
      ok: true,
      data: {
        subject: ReviewSubject.CLIENT_TO_FREELANCER,
        subjectUserId: participants.freelancerUserId,
        subjectUserName: participants.freelancerUserName
      }
    };
  }
  if (role === Role.FREELANCER) {
    return {
      ok: true,
      data: {
        subject: ReviewSubject.FREELANCER_TO_CLIENT,
        subjectUserId: participants.clientUserId,
        subjectUserName: participants.clientUserName
      }
    };
  }
  return err("Only clients and freelancers can submit reviews", "FORBIDDEN");
}

export async function getReviewEligibility(
  userId: string,
  role: Role,
  contractId: string
): Promise<ReviewServiceResult<ReviewEligibility>> {
  const participants = await loadContractParticipants(contractId);
  if (!participants) return err("Contract not found", "NOT_FOUND");

  const isClient = userId === participants.clientUserId;
  const isFreelancer = userId === participants.freelancerUserId;
  if (!isClient && !isFreelancer) {
    return { ok: true, data: { canReview: false, reason: "Not a contract participant" } };
  }

  if (participants.status !== ContractStatus.COMPLETED) {
    return {
      ok: true,
      data: { canReview: false, reason: "Contract must be completed before reviewing" }
    };
  }

  const directionRes = resolveDirection(role, participants);
  if (!directionRes.ok) return directionRes;
  const { subject, subjectUserId, subjectUserName } = directionRes.data;

  if (subjectUserId === userId) {
    return { ok: true, data: { canReview: false, reason: "You cannot review yourself" } };
  }

  const existing = await prisma.review.findUnique({
    where: {
      authorUserId_projectId_subject: {
        authorUserId: userId,
        projectId: participants.projectId,
        subject
      }
    },
    select: { id: true, status: true }
  });

  if (existing) {
    return {
      ok: true,
      data: {
        canReview: false,
        reason: "You already submitted a review for this project",
        direction: subject,
        reviewedUserId: subjectUserId,
        reviewedUserName: subjectUserName,
        existingReviewId: existing.id,
        existingStatus: existing.status
      }
    };
  }

  return {
    ok: true,
    data: {
      canReview: true,
      direction: subject,
      reviewedUserId: subjectUserId,
      reviewedUserName: subjectUserName
    }
  };
}

export async function createReview(
  userId: string,
  role: Role,
  input: { contractId: string; rating: number; comment?: string | null }
): Promise<ReviewServiceResult<{ reviewId: string }>> {
  if (input.rating < 1 || input.rating > 5) {
    return err("Rating must be between 1 and 5", "BAD_STATE");
  }

  const eligibility = await getReviewEligibility(userId, role, input.contractId);
  if (!eligibility.ok) return eligibility;
  if (!eligibility.data.canReview) {
    return err(eligibility.data.reason ?? "Not eligible to review", "BAD_STATE");
  }

  const participants = await loadContractParticipants(input.contractId);
  if (!participants) return err("Contract not found", "NOT_FOUND");

  const directionRes = resolveDirection(role, participants);
  if (!directionRes.ok) return directionRes;
  const { subject, subjectUserId } = directionRes.data;

  const comment = sanitizeReviewComment(input.comment);
  const freelancerProfileId =
    subject === ReviewSubject.CLIENT_TO_FREELANCER ? participants.freelancerProfileId : null;
  const clientProfileId =
    subject === ReviewSubject.FREELANCER_TO_CLIENT ? participants.clientProfileId : null;

  try {
    const review = await prisma.review.create({
      data: {
        rating: input.rating,
        comment,
        subject,
        status: ReviewStatus.PENDING,
        contractId: participants.contractId,
        projectId: participants.projectId,
        authorUserId: userId,
        subjectUserId,
        freelancerProfileId,
        clientProfileId
      },
      select: { id: true }
    });

    return { ok: true, data: { reviewId: review.id } };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return err("You already submitted a review for this project", "CONFLICT");
    }
    throw e;
  }
}

export async function getUserReviews(
  userId: string,
  page: number,
  limit: number
): Promise<{ items: PublicReviewRow[]; total: number; page: number; totalPages: number }> {
  const where = { subjectUserId: userId, status: ReviewStatus.APPROVED };
  const [total, rows] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: approvedReviewSelect
    })
  ]);

  const items: PublicReviewRow[] = rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    subject: r.subject,
    authorName: r.authorUser.name,
    projectTitle: r.project.title,
    createdAt: r.createdAt.toISOString()
  }));

  return {
    items,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit))
  };
}

export async function getReviewStats(userId: string): Promise<ReviewStats> {
  const grouped = await prisma.review.groupBy({
    by: ["rating"],
    where: { subjectUserId: userId, status: ReviewStatus.APPROVED },
    _count: { rating: true }
  });

  const breakdown: ReviewStats["breakdown"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalReviews = 0;
  let sum = 0;

  for (const row of grouped) {
    const star = row.rating as 1 | 2 | 3 | 4 | 5;
    if (star >= 1 && star <= 5) {
      breakdown[star] = row._count.rating;
      totalReviews += row._count.rating;
      sum += star * row._count.rating;
    }
  }

  return {
    averageRating: totalReviews > 0 ? Math.round((sum / totalReviews) * 100) / 100 : 0,
    totalReviews,
    breakdown
  };
}

async function recalculateFreelancerRating(freelancerProfileId: string) {
  const stats = await prisma.review.aggregate({
    where: {
      freelancerProfileId,
      status: ReviewStatus.APPROVED,
      subject: ReviewSubject.CLIENT_TO_FREELANCER
    },
    _avg: { rating: true },
    _count: { rating: true }
  });

  await prisma.freelancerProfile.update({
    where: { id: freelancerProfileId },
    data: {
      ratingAverage: stats._avg.rating ?? 0,
      ratingCount: stats._count.rating
    }
  });
}

async function notifyReviewApproved(reviewedUserId: string, rating: number) {
  const { dispatchEventNotification } = await import("@/lib/notifications/dispatch");
  await dispatchEventNotification({
    userId: reviewedUserId,
    type: NotificationType.REVIEW,
    title: "Your review was published",
    body: `A ${rating}-star review is now visible on your profile.`,
    data: { rating } satisfies Prisma.JsonObject
  });
}

export async function moderateReview(
  adminUserId: string,
  role: Role,
  reviewId: string,
  action: "approve" | "reject" | "delete"
): Promise<ReviewServiceResult<{ reviewId: string }>> {
  if (role !== Role.ADMIN) return err("Admin only", "FORBIDDEN");

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      status: true,
      rating: true,
      subjectUserId: true,
      freelancerProfileId: true,
      subject: true
    }
  });
  if (!review) return err("Review not found", "NOT_FOUND");

  if (action === "delete") {
    await prisma.review.delete({ where: { id: reviewId } });
    if (review.freelancerProfileId) {
      await recalculateFreelancerRating(review.freelancerProfileId);
    }
    return { ok: true, data: { reviewId } };
  }

  const nextStatus =
    action === "approve" ? ReviewStatus.APPROVED : ReviewStatus.REJECTED;

  if (review.status === nextStatus) {
    return { ok: true, data: { reviewId } };
  }

  const wasApproved = review.status === ReviewStatus.APPROVED;

  await prisma.review.update({
    where: { id: reviewId },
    data: { status: nextStatus }
  });

  if (review.freelancerProfileId) {
    await recalculateFreelancerRating(review.freelancerProfileId);
  }

  if (action === "approve" && !wasApproved) {
    await notifyReviewApproved(review.subjectUserId, review.rating);
  }

  return { ok: true, data: { reviewId } };
}

export type AdminReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  subject: ReviewSubject;
  status: ReviewStatus;
  authorName: string;
  subjectUserName: string;
  projectTitle: string;
  createdAt: string;
};

export async function listReviewsForModeration(
  page: number,
  limit: number,
  statusFilter?: ReviewStatus
): Promise<{ items: AdminReviewRow[]; total: number; page: number; totalPages: number }> {
  const where = statusFilter ? { status: statusFilter } : {};
  const [total, rows] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        rating: true,
        comment: true,
        subject: true,
        status: true,
        createdAt: true,
        authorUser: { select: { name: true } },
        subjectUser: { select: { name: true } },
        project: { select: { title: true } }
      }
    })
  ]);

  return {
    items: rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      subject: r.subject,
      status: r.status,
      authorName: r.authorUser.name,
      subjectUserName: r.subjectUser.name,
      projectTitle: r.project.title,
      createdAt: r.createdAt.toISOString()
    })),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit))
  };
}

export async function getPublicUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      role: true,
      imageFileId: true,
      freelancerProfile: {
        select: {
          id: true,
          headline: true,
          bio: true,
          hourlyRate: true,
          isPublic: true,
          ratingAverage: true,
          ratingCount: true,
          skills: { include: { skill: { select: { name: true } } } }
        }
      },
      clientProfile: {
        select: {
          id: true,
          companyName: true,
          websiteUrl: true
        }
      }
    }
  });
  return user;
}
