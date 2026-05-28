import "server-only";

import { ContractStatus, DisputeStatus, Role } from "@prisma/client";

import { prisma } from "@/lib/db";

export type DisputeServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function openContractDispute(
  userId: string,
  role: Role,
  contractId: string,
  reason: string
): Promise<DisputeServiceResult<{ disputeId: string }>> {
  if (role !== Role.CLIENT && role !== Role.FREELANCER) {
    return { ok: false, error: "Unauthorized" };
  }

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      dispute: true,
      project: { select: { client: { select: { userId: true } } } },
      proposal: { select: { freelancer: { select: { userId: true } } } }
    }
  });
  if (!contract) return { ok: false, error: "Contract not found" };

  const clientUserId = contract.project.client.userId;
  const freelancerUserId = contract.proposal.freelancer.userId;
  const isParty = userId === clientUserId || userId === freelancerUserId;
  if (!isParty) return { ok: false, error: "Forbidden" };

  if (contract.status !== ContractStatus.ACTIVE && contract.status !== ContractStatus.DISPUTED) {
    return { ok: false, error: "Disputes can only be opened on active contracts" };
  }
  if (contract.dispute && contract.dispute.status !== DisputeStatus.DISMISSED) {
    return { ok: false, error: "A dispute already exists for this contract" };
  }

  const trimmed = reason.trim().slice(0, 4000);
  if (trimmed.length < 20) return { ok: false, error: "Describe the issue in at least 20 characters" };

  const dispute = await prisma.$transaction(async (tx) => {
    if (contract.dispute) {
      await tx.dispute.delete({ where: { id: contract.dispute.id } });
    }
    const row = await tx.dispute.create({
      data: {
        contractId,
        openedByUserId: userId,
        reason: trimmed,
        status: DisputeStatus.OPEN
      },
      select: { id: true }
    });
    await tx.contract.update({
      where: { id: contractId },
      data: { status: ContractStatus.DISPUTED }
    });
    return row;
  });

  return { ok: true, data: { disputeId: dispute.id } };
}

export async function getContractDispute(contractId: string) {
  return prisma.dispute.findUnique({
    where: { contractId },
    select: {
      id: true,
      status: true,
      reason: true,
      resolution: true,
      createdAt: true,
      openedBy: { select: { name: true } }
    }
  });
}
