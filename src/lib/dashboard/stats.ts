import "server-only";

import { ContractStatus, ProjectStatus, ProposalStatus, Role } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getClientProfileIdForUser, getFreelancerProfileIdForUser } from "@/lib/projects/service";

export type DashboardStats = {
  activePipeline: number;
  winRate: string | null;
  spendOrEarnings: string;
  slaHealth: string;
  pipelineTrend?: string;
  spendTrend?: string;
};

function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

export async function getDashboardStats(userId: string, role: Role): Promise<DashboardStats> {
  if (role === Role.ADMIN) {
    const [openDisputes, pendingWithdrawals, activeProjects, users] = await Promise.all([
      prisma.dispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW", "ESCALATED"] } } }),
      prisma.withdrawalRequest.count({
        where: { status: { in: ["PENDING", "UNDER_REVIEW", "PROCESSING"] } }
      }),
      prisma.project.count({
        where: { status: { in: [ProjectStatus.OPEN, ProjectStatus.IN_PROGRESS] } }
      }),
      prisma.user.count()
    ]);

    return {
      activePipeline: openDisputes + pendingWithdrawals,
      winRate: null,
      spendOrEarnings: `${activeProjects} active · ${users} users`,
      slaHealth: "99.2%",
      pipelineTrend: pendingWithdrawals ? `${pendingWithdrawals} payouts` : undefined
    };
  }

  if (role === Role.FREELANCER) {
    const freelancerId = await getFreelancerProfileIdForUser(userId);
    if (!freelancerId) {
      return {
        activePipeline: 0,
        winRate: "—",
        spendOrEarnings: formatMoney(0),
        slaHealth: "—"
      };
    }

    const [pending, activeContracts, accepted, totalSubmitted, wallet] = await Promise.all([
      prisma.proposal.count({
        where: { freelancerId, status: ProposalStatus.PENDING }
      }),
      prisma.contract.count({
        where: {
          proposal: { freelancerId },
          status: { in: [ContractStatus.ACTIVE, ContractStatus.PENDING] }
        }
      }),
      prisma.proposal.count({
        where: { freelancerId, status: ProposalStatus.ACCEPTED }
      }),
      prisma.proposal.count({
        where: {
          freelancerId,
          status: { notIn: [ProposalStatus.WITHDRAWN] }
        }
      }),
      prisma.wallet.findUnique({
        where: { userId },
        select: { balance: true, currency: true }
      })
    ]);

    const winPct =
      totalSubmitted > 0 ? Math.round((accepted / totalSubmitted) * 100) : null;

    return {
      activePipeline: pending + activeContracts,
      winRate: winPct !== null ? `${winPct}%` : "—",
      spendOrEarnings: formatMoney(
        Number(wallet?.balance ?? 0),
        wallet?.currency ?? "USD"
      ),
      slaHealth: "On track",
      pipelineTrend: `${pending} pending proposals`,
      spendTrend: `${activeContracts} active contracts`
    };
  }

  const clientId = await getClientProfileIdForUser(userId);
  if (!clientId) {
    return {
      activePipeline: 0,
      winRate: null,
      spendOrEarnings: formatMoney(0),
      slaHealth: "—"
    };
  }

  const [openProjects, inProgress, activeContracts, payments] = await Promise.all([
    prisma.project.count({
      where: { clientId, status: ProjectStatus.OPEN }
    }),
    prisma.project.count({
      where: { clientId, status: ProjectStatus.IN_PROGRESS }
    }),
    prisma.contract.count({
      where: {
        project: { clientId },
        status: { in: [ContractStatus.ACTIVE, ContractStatus.PENDING] }
      }
    }),
    prisma.payment.aggregate({
      where: {
        status: "SUCCEEDED",
        contract: { project: { clientId } }
      },
      _sum: { amount: true }
    })
  ]);

  return {
    activePipeline: openProjects + inProgress + activeContracts,
    winRate: null,
    spendOrEarnings: formatMoney(Number(payments._sum.amount ?? 0)),
    slaHealth: "On track",
    pipelineTrend: `${openProjects} open · ${inProgress} in progress`
  };
}
