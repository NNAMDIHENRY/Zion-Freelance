import "server-only";

import {
  AbuseReportStatus,
  AccountStatus,
  ContractStatus,
  DisputeStatus,
  PaymentStatus,
  ProjectModerationStatus,
  ProjectStatus,
  WithdrawalStatus
} from "@prisma/client";

import { prisma } from "@/lib/db";

const ACTIVE_DAYS = 30;

export async function getPlatformAnalytics() {
  const since = new Date();
  since.setDate(since.getDate() - ACTIVE_DAYS);

  const [
    totalUsers,
    newUsers,
    activeUsers,
    suspendedUsers,
    flaggedUsers,
    activeProjects,
    completedProjects,
    flaggedProjects,
    openDisputes,
    totalDisputes,
    paymentAgg,
    escrowAgg,
    pendingWithdrawals,
    withdrawalVolume,
    openReports,
    pendingReviews
  ] = await Promise.all([
    prisma.user.count({ where: { role: { not: "ADMIN" } } }),
    prisma.user.count({ where: { createdAt: { gte: since }, role: { not: "ADMIN" } } }),
    prisma.user.count({
      where: {
        role: { not: "ADMIN" },
        OR: [
          { messagesSent: { some: { createdAt: { gte: since } } } },
          { clientProfile: { projects: { some: { updatedAt: { gte: since } } } } },
          { freelancerProfile: { proposals: { some: { updatedAt: { gte: since } } } } }
        ]
      }
    }),
    prisma.user.count({ where: { accountStatus: AccountStatus.SUSPENDED } }),
    prisma.user.count({ where: { moderationFlag: true } }),
    prisma.project.count({
      where: { status: { in: [ProjectStatus.OPEN, ProjectStatus.IN_PROGRESS] } }
    }),
    prisma.project.count({ where: { status: ProjectStatus.COMPLETED } }),
    prisma.project.count({
      where: {
        moderationStatus: {
          in: [ProjectModerationStatus.FLAGGED, ProjectModerationStatus.UNDER_REVIEW]
        }
      }
    }),
    prisma.dispute.count({
      where: { status: { in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW, DisputeStatus.ESCALATED] } }
    }),
    prisma.dispute.count(),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: PaymentStatus.SUCCEEDED }
    }),
    prisma.escrow.aggregate({
      _sum: { fundedAmount: true, releasedAmount: true }
    }),
    prisma.withdrawalRequest.count({
      where: { status: { in: [WithdrawalStatus.PENDING, WithdrawalStatus.UNDER_REVIEW] } }
    }),
    prisma.withdrawalRequest.aggregate({
      _sum: { amount: true },
      where: { status: WithdrawalStatus.COMPLETED }
    }),
    prisma.abuseReport.count({
      where: { status: { in: [AbuseReportStatus.OPEN, AbuseReportStatus.UNDER_REVIEW] } }
    }),
    prisma.review.count({ where: { status: "PENDING" } })
  ]);

  const platformVolume = Number(paymentAgg._sum.amount?.toString() ?? 0);
  const escrowFunded = Number(escrowAgg._sum.fundedAmount?.toString() ?? 0);
  const escrowReleased = Number(escrowAgg._sum.releasedAmount?.toString() ?? 0);
  const withdrawalsTotal = Number(withdrawalVolume._sum.amount?.toString() ?? 0);
  const disputeRatio =
    totalDisputes === 0 ? 0 : Math.round((openDisputes / totalDisputes) * 100);

  const [pendingPayments, failedPayments] = await Promise.all([
    prisma.payment.count({ where: { status: PaymentStatus.PENDING } }),
    prisma.payment.count({ where: { status: PaymentStatus.FAILED } })
  ]);

  const activeContracts = await prisma.contract.count({
    where: { status: ContractStatus.ACTIVE }
  });

  return {
    users: { totalUsers, newUsers, activeUsers, suspendedUsers, flaggedUsers },
    marketplace: {
      activeProjects,
      completedProjects,
      flaggedProjects,
      activeContracts,
      disputeRatio,
      openDisputes
    },
    financial: {
      platformVolume,
      escrowFunded,
      escrowUtilization:
        escrowFunded > 0 ? Math.round(((escrowFunded - escrowReleased) / escrowFunded) * 100) : 0,
      withdrawalsTotal,
      pendingWithdrawals,
      pendingPayments,
      failedPayments
    },
    operations: {
      openReports,
      pendingReviews,
      moderationQueue:
        flaggedUsers + flaggedProjects + openReports + openDisputes + pendingWithdrawals
    }
  };
}

export async function getAdminOverviewKpis() {
  const analytics = await getPlatformAnalytics();
  return {
    kpis: [
      { title: "Total users", value: String(analytics.users.totalUsers) },
      { title: "Active projects", value: String(analytics.marketplace.activeProjects) },
      {
        title: "Platform volume",
        value: `$${analytics.financial.platformVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
      },
      {
        title: "Moderation queue",
        value: String(analytics.operations.moderationQueue),
        alert: analytics.operations.moderationQueue > 0
      }
    ],
    analytics
  };
}
