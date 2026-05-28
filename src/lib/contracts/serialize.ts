import type { Prisma } from "@prisma/client";

import { deriveEscrowStatus, heldEscrowAmount, pendingEscrowAmount } from "@/lib/contracts/transitions";

import type { ContractDetailDTO, ContractListItemDTO } from "@/components/contracts/types";

type ContractListRow = Prisma.ContractGetPayload<{
  include: {
    project: { select: { id: true; title: true; status: true } };
    proposal: {
      select: {
        freelancer: { select: { user: { select: { name: true; email: true } } } };
      };
    };
    escrow: { select: { status: true; fundedAmount: true; releasedAmount: true } };
    milestones: { select: { status: true } };
    _count: { select: { milestones: true } };
  };
}>;

type ContractDetailRow = Prisma.ContractGetPayload<{
  include: {
    project: {
      select: {
        id: true;
        title: true;
        status: true;
        client: { select: { user: { select: { id: true; name: true; email: true } } } };
      };
    };
    proposal: {
      select: {
        deliveryDays: true;
        freelancer: { select: { user: { select: { id: true; name: true; email: true } } } };
      };
    };
    escrow: true;
    milestones: { orderBy: { sortOrder: "asc" } };
  };
}>;

function milestoneProgress(milestones: { status: string }[]) {
  if (!milestones.length) return 0;
  const weights: Record<string, number> = {
    PENDING: 0,
    FUNDED: 0.15,
    ACTIVE: 0.3,
    SUBMITTED: 0.6,
    APPROVED: 0.85,
    RELEASED: 1
  };
  const sum = milestones.reduce((acc, m) => acc + (weights[m.status] ?? 0), 0);
  return Math.round((sum / milestones.length) * 100);
}

export function serializeContractListItem(row: ContractListRow): ContractListItemDTO {
  const escrow = row.escrow;
  const derivedStatus = escrow
    ? deriveEscrowStatus(row.agreedAmount, escrow.fundedAmount, escrow.releasedAmount)
    : null;

  return {
    id: row.id,
    status: row.status,
    projectId: row.project.id,
    projectTitle: row.project.title,
    agreedAmount: row.agreedAmount.toString(),
    currency: row.currency,
    createdAt: row.createdAt.toISOString(),
    freelancerName:
      row.proposal.freelancer.user.name ?? row.proposal.freelancer.user.email,
    milestoneCount: row._count.milestones,
    completionPercent: milestoneProgress(row.milestones),
    escrowStatus: derivedStatus ?? escrow?.status ?? null,
    fundedAmount: escrow?.fundedAmount.toString() ?? "0",
    releasedAmount: escrow?.releasedAmount.toString() ?? "0"
  };
}

export function serializeContractDetail(
  row: ContractDetailRow,
  viewerRole: "client" | "freelancer"
): ContractDetailDTO {
  const escrow = row.escrow;
  const derivedStatus = escrow
    ? deriveEscrowStatus(row.agreedAmount, escrow.fundedAmount, escrow.releasedAmount)
    : null;

  return {
    id: row.id,
    status: row.status,
    agreedAmount: row.agreedAmount.toString(),
    currency: row.currency,
    deliveryDays: row.deliveryDays ?? row.proposal.deliveryDays,
    deliveryTerms: row.deliveryTerms,
    createdAt: row.createdAt.toISOString(),
    acceptedAt: row.acceptedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    completionNote: row.completionNote,
    project: {
      id: row.project.id,
      title: row.project.title,
      status: row.project.status
    },
    client: {
      userId: row.project.client.user.id,
      name: row.project.client.user.name ?? row.project.client.user.email,
      email: row.project.client.user.email
    },
    freelancer: {
      userId: row.proposal.freelancer.user.id,
      name: row.proposal.freelancer.user.name ?? row.proposal.freelancer.user.email,
      email: row.proposal.freelancer.user.email
    },
    viewerRole,
    escrow: escrow
      ? {
          status: derivedStatus ?? escrow.status,
          fundedAmount: escrow.fundedAmount.toString(),
          releasedAmount: escrow.releasedAmount.toString(),
          pendingAmount: pendingEscrowAmount(
            row.agreedAmount,
            escrow.fundedAmount,
            escrow.releasedAmount
          ).toFixed(4),
          heldAmount: heldEscrowAmount(escrow.fundedAmount, escrow.releasedAmount).toFixed(4),
          currency: escrow.currency
        }
      : null,
    milestones: row.milestones.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      amount: m.amount.toString(),
      currency: m.currency,
      dueDate: m.dueDate?.toISOString() ?? null,
      status: m.status,
      sortOrder: m.sortOrder,
      submittedAt: m.submittedAt?.toISOString() ?? null,
      approvedAt: m.approvedAt?.toISOString() ?? null,
      releasedAt: m.releasedAt?.toISOString() ?? null
    })),
    completionPercent: milestoneProgress(row.milestones)
  };
}
