import "server-only";

import {
  AbuseReportStatus,
  DisputeStatus,
  PaymentStatus,
  Prisma,
  ProjectModerationStatus,
  TransactionType,
  WithdrawalStatus
} from "@prisma/client";

import { recordAdminAudit } from "@/lib/admin/audit";
import {
  assertWithdrawalTransition,
  isWithdrawalTerminal
} from "@/lib/admin/transitions";
import { prisma } from "@/lib/db";
import { processWithdrawal } from "@/lib/payments/service";
import type { adminPaymentListSchema } from "@/lib/validators/admin";
import type { z } from "zod";

type ListInput = z.infer<typeof adminPaymentListSchema>;

export async function getPaymentMonitoringSummary() {
  const [succeeded, pending, failed, suspicious] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: PaymentStatus.SUCCEEDED },
      _sum: { amount: true },
      _count: true
    }),
    prisma.payment.count({ where: { status: PaymentStatus.PENDING } }),
    prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
    prisma.payment.count({
      where: {
        OR: [
          { failureReason: { not: null } },
          { amount: { gt: 10000 } }
        ],
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    })
  ]);

  return {
    totalVolume: Number(succeeded._sum.amount?.toString() ?? 0),
    completedCount: succeeded._count,
    pendingCount: pending,
    failedCount: failed,
    suspiciousCount: suspicious
  };
}

export async function listAdminPayments(input: ListInput) {
  const page = input.page;
  const pageSize = input.pageSize;
  const skip = (page - 1) * pageSize;

  const where: Prisma.PaymentWhereInput = {};
  if (input.status && Object.values(PaymentStatus).includes(input.status as PaymentStatus)) {
    where.status = input.status as PaymentStatus;
  }
  if (input.from || input.to) {
    where.createdAt = {};
    if (input.from) where.createdAt.gte = new Date(input.from);
    if (input.to) where.createdAt.lte = new Date(input.to);
  }

  const [total, rows] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        contract: { include: { project: { select: { title: true } } } },
        payerWallet: { include: { user: { select: { id: true, name: true, email: true } } } }
      }
    })
  ]);

  return {
    items: rows.map((p) => ({
      id: p.id,
      amount: p.amount.toString(),
      currency: p.currency,
      status: p.status,
      provider: p.provider,
      projectTitle: p.contract?.project.title ?? "—",
      payerName: p.payerWallet?.user.name ?? "—",
      createdAt: p.createdAt.toISOString(),
      failureReason: p.failureReason
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

export async function listAdminWithdrawals(page = 1, pageSize = 20, status?: WithdrawalStatus) {
  const skip = (page - 1) * pageSize;
  const where: Prisma.WithdrawalRequestWhereInput = status ? { status } : {};

  const [total, rows] = await Promise.all([
    prisma.withdrawalRequest.count({ where }),
    prisma.withdrawalRequest.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        wallet: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            transactions: {
              where: { type: TransactionType.WITHDRAWAL },
              take: 3,
              orderBy: { createdAt: "desc" }
            }
          }
        }
      }
    })
  ]);

  return {
    items: rows.map((w) => ({
      id: w.id,
      amount: w.amount.toString(),
      currency: w.currency,
      status: w.status,
      flaggedForReview: w.flaggedForReview,
      payoutMethod: w.payoutMethod,
      requesterName: w.wallet.user.name,
      requesterEmail: w.wallet.user.email,
      walletBalance: w.wallet.balance.toString(),
      priorWithdrawals: w.wallet.transactions.length,
      createdAt: w.createdAt.toISOString(),
      reviewNote: w.reviewNote
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

export async function adminWithdrawalAction(
  adminUserId: string,
  withdrawalId: string,
  action: "approve" | "reject" | "review" | "unflag",
  note?: string
) {
  const withdrawal = await prisma.withdrawalRequest.findUnique({
    where: { id: withdrawalId },
    include: { wallet: true }
  });
  if (!withdrawal) throw new Error("Withdrawal not found");
  if (isWithdrawalTerminal(withdrawal.status)) {
    throw new Error("Withdrawal already finalized");
  }

  const before = {
    status: withdrawal.status,
    flaggedForReview: withdrawal.flaggedForReview
  };

  if (action === "review") {
    assertWithdrawalTransition(withdrawal.status, WithdrawalStatus.UNDER_REVIEW);
    const updated = await prisma.withdrawalRequest.update({
      where: { id: withdrawalId },
      data: {
        status: WithdrawalStatus.UNDER_REVIEW,
        flaggedForReview: true,
        reviewedByAdminId: adminUserId
      }
    });
    await recordAdminAudit({
      adminUserId,
      action: "withdrawal.review",
      entityType: "WithdrawalRequest",
      entityId: withdrawalId,
      beforeState: before,
      afterState: { status: updated.status, flaggedForReview: updated.flaggedForReview }
    });
    return updated;
  }

  if (action === "unflag") {
    const updated = await prisma.withdrawalRequest.update({
      where: { id: withdrawalId },
      data: { flaggedForReview: false }
    });
    await recordAdminAudit({
      adminUserId,
      action: "withdrawal.unflag",
      entityType: "WithdrawalRequest",
      entityId: withdrawalId,
      beforeState: before,
      afterState: { flaggedForReview: updated.flaggedForReview }
    });
    return updated;
  }

  const next =
    action === "approve" ? WithdrawalStatus.APPROVED : WithdrawalStatus.REJECTED;
  assertWithdrawalTransition(withdrawal.status, next);

  const result = await processWithdrawal(
    adminUserId,
    withdrawalId,
    action === "approve" ? "approve" : "reject",
    note
  );
  if (!result.ok) throw new Error(result.error);

  await prisma.withdrawalRequest.update({
    where: { id: withdrawalId },
    data: { reviewedByAdminId: adminUserId, flaggedForReview: false }
  });

  await recordAdminAudit({
    adminUserId,
    action: `withdrawal.${action}`,
    entityType: "WithdrawalRequest",
    entityId: withdrawalId,
    beforeState: before,
    afterState: { status: next }
  });

  return { id: withdrawalId, status: next };
}

export async function getModerationQueue() {
  const [flaggedUsers, flaggedProjects, openReports, openDisputes, pendingWithdrawals] =
    await Promise.all([
      prisma.user.findMany({
        where: { moderationFlag: true },
        take: 5,
        orderBy: { updatedAt: "desc" },
        select: { id: true, name: true, email: true }
      }),
      prisma.project.findMany({
        where: {
          moderationStatus: {
            in: [ProjectModerationStatus.FLAGGED, ProjectModerationStatus.UNDER_REVIEW]
          }
        },
        take: 5,
        orderBy: { moderatedAt: "desc" },
        select: { id: true, title: true, moderationStatus: true }
      }),
      prisma.abuseReport.findMany({
        where: {
          status: { in: [AbuseReportStatus.OPEN, AbuseReportStatus.UNDER_REVIEW] }
        },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, category: true, severity: true }
      }),
      prisma.dispute.findMany({
        where: {
          status: {
            in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW, DisputeStatus.ESCALATED]
          }
        },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, status: true, reason: true }
      }),
      prisma.withdrawalRequest.findMany({
        where: {
          OR: [
            { status: WithdrawalStatus.PENDING },
            { flaggedForReview: true }
          ]
        },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, amount: true, status: true, flaggedForReview: true }
      })
    ]);

  return { flaggedUsers, flaggedProjects, openReports, openDisputes, pendingWithdrawals };
}
