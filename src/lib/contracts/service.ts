import "server-only";

import {
  ContractStatus,
  EscrowRecordType,
  EscrowStatus,
  MilestoneStatus,
  Prisma,
  ProjectStatus,
  Role
} from "@prisma/client";

import {
  assertContractTransition,
  assertMilestoneTransition,
  deriveEscrowStatus
} from "@/lib/contracts/transitions";
import { prisma } from "@/lib/db";
import { fundEscrowFromWallet } from "@/lib/payments/service";
import { ensureWalletForUser, releaseEscrowToPayee } from "@/lib/payments/wallet/service";
import { generateIdempotencyKey } from "@/lib/payments/references";
import {
  notifyContractAccepted,
  notifyContractCompleted,
  notifyMilestoneApproved,
  notifyMilestoneReleased,
  notifyMilestoneSubmitted
} from "@/lib/notifications/workflow-events";
import { getClientProfileIdForUser, getFreelancerProfileIdForUser } from "@/lib/projects/service";
import type { MilestoneInput, SetupMilestonesInput } from "@/lib/validators/contract";

export type ContractServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code: ContractServiceErrorCode };

export type ContractServiceErrorCode =
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "CONFLICT"
  | "BAD_STATE";

function err(error: string, code: ContractServiceErrorCode): ContractServiceResult<never> {
  return { ok: false, error, code };
}

const contractListInclude = {
  project: { select: { id: true, title: true, status: true } },
  proposal: {
    select: {
      freelancer: { select: { user: { select: { name: true, email: true } } } }
    }
  },
  escrow: { select: { status: true, fundedAmount: true, releasedAmount: true } },
  milestones: { select: { status: true } },
  _count: { select: { milestones: true } }
} as const;

const contractDetailInclude = {
  project: {
    select: {
      id: true,
      title: true,
      status: true,
      client: { select: { user: { select: { id: true, name: true, email: true } } } }
    }
  },
  proposal: {
    select: {
      deliveryDays: true,
      freelancer: { select: { user: { select: { id: true, name: true, email: true } } } }
    }
  },
  escrow: true,
  milestones: { orderBy: { sortOrder: "asc" as const } }
} as const;

type ContractAccess = {
  contractId: string;
  role: "client" | "freelancer";
  clientUserId: string;
  freelancerUserId: string;
  status: ContractStatus;
  agreedAmount: Prisma.Decimal;
  currency: string;
};

async function getContractAccess(
  userId: string,
  role: Role,
  contractId: string
): Promise<ContractServiceResult<ContractAccess>> {
  const row = await prisma.contract.findUnique({
    where: { id: contractId },
    select: {
      id: true,
      status: true,
      agreedAmount: true,
      currency: true,
      project: { select: { client: { select: { userId: true } } } },
      proposal: { select: { freelancer: { select: { userId: true } } } }
    }
  });
  if (!row) return err("Contract not found", "NOT_FOUND");

  const clientUserId = row.project.client.userId;
  const freelancerUserId = row.proposal.freelancer.userId;
  const isClient = role === Role.CLIENT && clientUserId === userId;
  const isFreelancer = role === Role.FREELANCER && freelancerUserId === userId;

  if (!isClient && !isFreelancer) {
    return err("You do not have access to this contract", "FORBIDDEN");
  }

  return {
    ok: true,
    data: {
      contractId: row.id,
      role: isClient ? "client" : "freelancer",
      clientUserId,
      freelancerUserId,
      status: row.status,
      agreedAmount: row.agreedAmount,
      currency: row.currency
    }
  };
}

export async function listContractsForUser(userId: string, role: Role) {
  if (role === Role.CLIENT) {
    const clientProfileId = await getClientProfileIdForUser(userId);
    if (!clientProfileId) return err("Client profile required", "FORBIDDEN");
    const rows = await prisma.contract.findMany({
      where: { project: { clientId: clientProfileId } },
      include: contractListInclude,
      orderBy: { createdAt: "desc" }
    });
    return { ok: true as const, data: rows };
  }

  if (role === Role.FREELANCER) {
    const freelancerProfileId = await getFreelancerProfileIdForUser(userId);
    if (!freelancerProfileId) return err("Freelancer profile required", "FORBIDDEN");
    const rows = await prisma.contract.findMany({
      where: { proposal: { freelancerId: freelancerProfileId } },
      include: contractListInclude,
      orderBy: { createdAt: "desc" }
    });
    return { ok: true as const, data: rows };
  }

  return err("Forbidden", "FORBIDDEN");
}

export async function getContractDetailForUser(
  userId: string,
  role: Role,
  contractId: string
) {
  const access = await getContractAccess(userId, role, contractId);
  if (!access.ok) return access;

  const row = await prisma.contract.findUnique({
    where: { id: contractId },
    include: contractDetailInclude
  });
  if (!row) return err("Contract not found", "NOT_FOUND");

  return { ok: true as const, data: { row, viewerRole: access.data.role } };
}

export async function acceptContract(
  userId: string,
  role: Role,
  contractId: string
): Promise<ContractServiceResult<{ contractId: string }>> {
  if (role !== Role.FREELANCER) return err("Only the freelancer can accept the contract", "FORBIDDEN");

  const access = await getContractAccess(userId, role, contractId);
  if (!access.ok) return access;
  if (access.data.role !== "freelancer") return err("Forbidden", "FORBIDDEN");
  if (access.data.status !== ContractStatus.PENDING) {
    return err("Contract is not awaiting acceptance", "BAD_STATE");
  }

  await prisma.$transaction(async (tx) => {
    assertContractTransition(ContractStatus.PENDING, ContractStatus.ACTIVE);
    await tx.contract.update({
      where: { id: contractId },
      data: { status: ContractStatus.ACTIVE, acceptedAt: new Date(), startsAt: new Date() }
    });

    await tx.contractMilestone.updateMany({
      where: { contractId, status: MilestoneStatus.FUNDED },
      data: { status: MilestoneStatus.ACTIVE }
    });
  });

  return { ok: true, data: { contractId } };
}

async function assertMilestonesEditable(
  contractId: string
): Promise<ContractServiceResult<{ currency: string; agreedAmount: Prisma.Decimal }>> {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { escrow: true, milestones: { select: { status: true, amount: true } } }
  });
  if (!contract?.escrow) return err("Contract not found", "NOT_FOUND");
  if (contract.status !== ContractStatus.PENDING) {
    return err("Milestones can only be edited before the contract is active", "BAD_STATE");
  }
  if (Number(contract.escrow.fundedAmount.toString()) > 0) {
    return err("Cannot change milestones after funding has started", "BAD_STATE");
  }
  const locked = contract.milestones.some((m) => m.status !== MilestoneStatus.PENDING);
  if (locked) {
    return err("Cannot edit milestones once funding workflow has started", "BAD_STATE");
  }
  return {
    ok: true,
    data: { currency: contract.currency, agreedAmount: contract.agreedAmount }
  };
}

export async function setupMilestones(
  userId: string,
  role: Role,
  contractId: string,
  input: SetupMilestonesInput
): Promise<ContractServiceResult<{ contractId: string }>> {
  if (role !== Role.CLIENT && role !== Role.FREELANCER) {
    return err("Only contract parties can configure milestones", "FORBIDDEN");
  }

  const access = await getContractAccess(userId, role, contractId);
  if (!access.ok) return access;
  if (access.data.status !== ContractStatus.PENDING) {
    return err("Milestones can only be configured before the contract is active", "BAD_STATE");
  }

  const total = input.milestones.reduce((s, m) => s + m.amount, 0);
  const agreed = Number(access.data.agreedAmount.toString());
  if (Math.abs(total - agreed) > 0.01) {
    return err(`Milestone amounts must equal ${access.data.agreedAmount.toString()} ${access.data.currency}`, "BAD_STATE");
  }

  const editable = await assertMilestonesEditable(contractId);
  if (!editable.ok) return editable;

  await prisma.$transaction(async (tx) => {
    await tx.contractMilestone.deleteMany({ where: { contractId } });
    await tx.contractMilestone.createMany({
      data: input.milestones.map((m, i) => ({
        contractId,
        title: m.title,
        description: m.description ?? null,
        amount: m.amount,
        currency: access.data.currency,
        dueDate: m.dueDate ?? null,
        sortOrder: i,
        status: MilestoneStatus.PENDING
      }))
    });
  });

  return { ok: true, data: { contractId } };
}

export async function fundEscrow(
  userId: string,
  role: Role,
  contractId: string,
  amount?: number
): Promise<ContractServiceResult<{ contractId: string }>> {
  if (role !== Role.CLIENT) return err("Only the client can fund escrow", "FORBIDDEN");

  const access = await getContractAccess(userId, role, contractId);
  if (!access.ok) return access;

  const result = await fundEscrowFromWallet(userId, contractId, amount);
  if (!result.ok) {
    return err(result.error, result.code === "FORBIDDEN" ? "FORBIDDEN" : result.code === "NOT_FOUND" ? "NOT_FOUND" : "BAD_STATE");
  }
  return { ok: true, data: { contractId } };
}

export async function submitMilestoneWork(
  userId: string,
  role: Role,
  contractId: string,
  milestoneId: string
): Promise<ContractServiceResult<{ milestoneId: string }>> {
  if (role !== Role.FREELANCER) return err("Only the freelancer can submit milestone work", "FORBIDDEN");

  const access = await getContractAccess(userId, role, contractId);
  if (!access.ok) return access;
  if (access.data.status !== ContractStatus.ACTIVE) {
    return err("Contract must be active to submit work", "BAD_STATE");
  }

  const milestone = await prisma.contractMilestone.findFirst({
    where: { id: milestoneId, contractId }
  });
  if (!milestone) return err("Milestone not found", "NOT_FOUND");
  if (milestone.status !== MilestoneStatus.ACTIVE) {
    return err("This milestone is not ready for submission", "BAD_STATE");
  }

  assertMilestoneTransition(MilestoneStatus.ACTIVE, MilestoneStatus.SUBMITTED);
  await prisma.contractMilestone.update({
    where: { id: milestoneId },
    data: { status: MilestoneStatus.SUBMITTED, submittedAt: new Date() }
  });

  void notifyMilestoneSubmitted({
    clientUserId: access.data.clientUserId,
    contractId,
    milestoneId,
    milestoneTitle: milestone.title
  });

  return { ok: true, data: { milestoneId } };
}

export async function addContractMilestone(
  userId: string,
  role: Role,
  contractId: string,
  input: MilestoneInput
): Promise<ContractServiceResult<{ milestoneId: string }>> {
  if (role !== Role.CLIENT && role !== Role.FREELANCER) {
    return err("Only contract parties can add milestones", "FORBIDDEN");
  }
  const access = await getContractAccess(userId, role, contractId);
  if (!access.ok) return access;

  const editable = await assertMilestonesEditable(contractId);
  if (!editable.ok) return editable;

  const existing = await prisma.contractMilestone.aggregate({
    where: { contractId },
    _sum: { amount: true },
    _max: { sortOrder: true }
  });
  const currentTotal = Number(existing._sum.amount?.toString() ?? "0");
  const agreed = Number(editable.data.agreedAmount.toString());
  if (currentTotal + input.amount > agreed + 0.01) {
    return err("Milestone total cannot exceed the agreed contract amount", "BAD_STATE");
  }

  const created = await prisma.contractMilestone.create({
    data: {
      contractId,
      title: input.title,
      description: input.description ?? null,
      amount: input.amount,
      currency: editable.data.currency,
      dueDate: input.dueDate ?? null,
      sortOrder: (existing._max.sortOrder ?? -1) + 1,
      status: MilestoneStatus.PENDING
    }
  });

  return { ok: true, data: { milestoneId: created.id } };
}

export async function updateContractMilestone(
  userId: string,
  role: Role,
  contractId: string,
  milestoneId: string,
  input: MilestoneInput
): Promise<ContractServiceResult<{ milestoneId: string }>> {
  if (role !== Role.CLIENT && role !== Role.FREELANCER) {
    return err("Only contract parties can update milestones", "FORBIDDEN");
  }
  const access = await getContractAccess(userId, role, contractId);
  if (!access.ok) return access;

  const editable = await assertMilestonesEditable(contractId);
  if (!editable.ok) return editable;

  const milestone = await prisma.contractMilestone.findFirst({
    where: { id: milestoneId, contractId }
  });
  if (!milestone) return err("Milestone not found", "NOT_FOUND");

  const others = await prisma.contractMilestone.aggregate({
    where: { contractId, id: { not: milestoneId } },
    _sum: { amount: true }
  });
  const otherTotal = Number(others._sum.amount?.toString() ?? "0");
  const agreed = Number(editable.data.agreedAmount.toString());
  if (otherTotal + input.amount > agreed + 0.01) {
    return err("Milestone total cannot exceed the agreed contract amount", "BAD_STATE");
  }

  await prisma.contractMilestone.update({
    where: { id: milestoneId },
    data: {
      title: input.title,
      description: input.description ?? null,
      amount: input.amount,
      dueDate: input.dueDate ?? null
    }
  });

  return { ok: true, data: { milestoneId } };
}

export async function deleteContractMilestone(
  userId: string,
  role: Role,
  contractId: string,
  milestoneId: string
): Promise<ContractServiceResult<{ milestoneId: string }>> {
  if (role !== Role.CLIENT && role !== Role.FREELANCER) {
    return err("Only contract parties can remove milestones", "FORBIDDEN");
  }
  const access = await getContractAccess(userId, role, contractId);
  if (!access.ok) return access;

  const editable = await assertMilestonesEditable(contractId);
  if (!editable.ok) return editable;

  const count = await prisma.contractMilestone.count({ where: { contractId } });
  if (count <= 1) return err("At least one milestone is required", "BAD_STATE");

  await prisma.contractMilestone.delete({ where: { id: milestoneId, contractId } });
  return { ok: true, data: { milestoneId } };
}

export async function approveMilestone(
  userId: string,
  role: Role,
  contractId: string,
  milestoneId: string
): Promise<ContractServiceResult<{ milestoneId: string }>> {
  if (role !== Role.CLIENT) return err("Only the client can approve milestones", "FORBIDDEN");

  const access = await getContractAccess(userId, role, contractId);
  if (!access.ok) return access;
  if (access.data.status !== ContractStatus.ACTIVE) {
    return err("Contract must be active", "BAD_STATE");
  }

  const milestone = await prisma.contractMilestone.findFirst({
    where: { id: milestoneId, contractId }
  });
  if (!milestone) return err("Milestone not found", "NOT_FOUND");
  if (milestone.status !== MilestoneStatus.SUBMITTED) {
    return err("Milestone must be submitted before approval", "BAD_STATE");
  }

  assertMilestoneTransition(MilestoneStatus.SUBMITTED, MilestoneStatus.APPROVED);
  await prisma.contractMilestone.update({
    where: { id: milestoneId },
    data: { status: MilestoneStatus.APPROVED, approvedAt: new Date() }
  });

  void notifyMilestoneApproved({
    freelancerUserId: access.data.freelancerUserId,
    contractId,
    milestoneId,
    milestoneTitle: milestone.title
  });

  return { ok: true, data: { milestoneId } };
}

export async function releaseMilestone(
  userId: string,
  role: Role,
  contractId: string,
  milestoneId: string
): Promise<ContractServiceResult<{ milestoneId: string }>> {
  if (role !== Role.CLIENT) return err("Only the client can release milestone funds", "FORBIDDEN");

  const access = await getContractAccess(userId, role, contractId);
  if (!access.ok) return access;

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { escrow: true }
  });
  if (!contract?.escrow) return err("Escrow not found", "NOT_FOUND");

  const milestone = await prisma.contractMilestone.findFirst({
    where: { id: milestoneId, contractId }
  });
  if (!milestone) return err("Milestone not found", "NOT_FOUND");
  if (milestone.status !== MilestoneStatus.APPROVED) {
    return err("Milestone must be approved before release", "BAD_STATE");
  }

  const releaseAmt = Number(milestone.amount.toString());
  const funded = Number(contract.escrow.fundedAmount.toString());
  const released = Number(contract.escrow.releasedAmount.toString());
  if (released + releaseAmt > funded + 0.0001) {
    return err("Insufficient funded escrow balance", "BAD_STATE");
  }

  const clientUserId = (
    await prisma.contract.findUnique({
      where: { id: contractId },
      select: { project: { select: { client: { select: { userId: true } } } } }
    })
  )?.project.client.userId;
  const freelancerUserId = (
    await prisma.contract.findUnique({
      where: { id: contractId },
      select: { proposal: { select: { freelancer: { select: { userId: true } } } } }
    })
  )?.proposal.freelancer.userId;

  if (!clientUserId || !freelancerUserId) {
    return err("Contract parties not found", "NOT_FOUND");
  }

  const clientWallet = await ensureWalletForUser(clientUserId, contract.currency);
  const freelancerWallet = await ensureWalletForUser(freelancerUserId, contract.currency);

  await prisma.$transaction(async (tx) => {
    assertMilestoneTransition(MilestoneStatus.APPROVED, MilestoneStatus.RELEASED);
    const newReleased = released + releaseAmt;
    const nextEscrowStatus = deriveEscrowStatus(
      contract.agreedAmount,
      contract.escrow!.fundedAmount,
      newReleased
    );

    await tx.contractMilestone.update({
      where: { id: milestoneId },
      data: { status: MilestoneStatus.RELEASED, releasedAt: new Date() }
    });

    await tx.escrow.update({
      where: { id: contract.escrow!.id },
      data: {
        releasedAmount: newReleased,
        status: nextEscrowStatus,
        fullyReleasedAt:
          nextEscrowStatus === EscrowStatus.RELEASED ? new Date() : contract.escrow!.fullyReleasedAt
      }
    });

    const escrowRecord = await tx.escrowRecord.create({
      data: {
        escrowId: contract.escrow!.id,
        type:
          nextEscrowStatus === EscrowStatus.RELEASED
            ? EscrowRecordType.RELEASE
            : EscrowRecordType.PARTIAL_RELEASE,
        amount: releaseAmt,
        currency: contract.currency,
        note: `Milestone release: ${milestone.title}`
      }
    });

    await releaseEscrowToPayee(tx, {
      payerWalletId: clientWallet.id,
      payeeWalletId: freelancerWallet.id,
      amount: releaseAmt,
      description: `Milestone release: ${milestone.title}`,
      idempotencyKey: generateIdempotencyKey(`release_${milestoneId}`),
      escrowRecordId: escrowRecord.id
    });
  });

  const amountLabel = `${releaseAmt} ${contract.currency}`;
  void notifyMilestoneReleased({
    userId: clientUserId,
    contractId,
    milestoneId,
    milestoneTitle: milestone.title,
    amountLabel
  });
  void notifyMilestoneReleased({
    userId: freelancerUserId,
    contractId,
    milestoneId,
    milestoneTitle: milestone.title,
    amountLabel
  });

  return { ok: true, data: { milestoneId } };
}

export async function submitContractCompletion(
  userId: string,
  role: Role,
  contractId: string,
  note?: string
): Promise<ContractServiceResult<{ contractId: string }>> {
  if (role !== Role.FREELANCER) return err("Only the freelancer can mark work complete", "FORBIDDEN");

  const access = await getContractAccess(userId, role, contractId);
  if (!access.ok) return access;
  if (access.data.status !== ContractStatus.ACTIVE) {
    return err("Contract must be active", "BAD_STATE");
  }

  await prisma.contract.update({
    where: { id: contractId },
    data: { completionNote: note?.trim() || null }
  });

  return { ok: true, data: { contractId } };
}

export async function approveContractCompletion(
  userId: string,
  role: Role,
  contractId: string
): Promise<ContractServiceResult<{ contractId: string }>> {
  if (role !== Role.CLIENT) return err("Only the client can close the contract", "FORBIDDEN");

  const access = await getContractAccess(userId, role, contractId);
  if (!access.ok) return access;
  if (access.data.status !== ContractStatus.ACTIVE) {
    return err("Contract must be active to complete", "BAD_STATE");
  }

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      escrow: true,
      milestones: true,
      project: { select: { client: { select: { userId: true } } } },
      proposal: { select: { freelancer: { select: { userId: true } } } }
    }
  });
  if (!contract) return err("Contract not found", "NOT_FOUND");

  const clientUserId = contract.project.client.userId;
  const freelancerUserId = contract.proposal.freelancer.userId;
  const clientWallet = await ensureWalletForUser(clientUserId, contract.currency);
  const freelancerWallet = await ensureWalletForUser(freelancerUserId, contract.currency);

  const unreleased = contract.milestones.filter((m) => m.status === MilestoneStatus.APPROVED);
  const agreed = Number(contract.agreedAmount.toString());

  await prisma.$transaction(async (tx) => {
    for (const m of unreleased) {
      const releaseAmt = Number(m.amount.toString());
      const escrow = await tx.escrow.findUnique({ where: { contractId } });
      if (!escrow) continue;
      const released = Number(escrow.releasedAmount.toString());
      const newReleased = released + releaseAmt;

      await tx.contractMilestone.update({
        where: { id: m.id },
        data: { status: MilestoneStatus.RELEASED, releasedAt: new Date() }
      });

      await tx.escrow.update({
        where: { id: escrow.id },
        data: {
          releasedAmount: newReleased,
          status: deriveEscrowStatus(contract.agreedAmount, escrow.fundedAmount, newReleased),
          fullyReleasedAt: newReleased >= agreed - 0.0001 ? new Date() : escrow.fullyReleasedAt
        }
      });

      const escrowRecord = await tx.escrowRecord.create({
        data: {
          escrowId: escrow.id,
          type: EscrowRecordType.RELEASE,
          amount: releaseAmt,
          currency: contract.currency,
          note: `Final release: ${m.title}`
        }
      });

      await releaseEscrowToPayee(tx, {
        payerWalletId: clientWallet.id,
        payeeWalletId: freelancerWallet.id,
        amount: releaseAmt,
        description: `Final release: ${m.title}`,
        idempotencyKey: generateIdempotencyKey(`final_release_${m.id}`),
        escrowRecordId: escrowRecord.id
      });
    }

    assertContractTransition(ContractStatus.ACTIVE, ContractStatus.COMPLETED);
    await tx.contract.update({
      where: { id: contractId },
      data: { status: ContractStatus.COMPLETED, completedAt: new Date(), endsAt: new Date() }
    });

    await tx.project.update({
      where: { id: contract.projectId },
      data: { status: ProjectStatus.COMPLETED }
    });
  });

  const projectTitle = (
    await prisma.project.findUnique({
      where: { id: contract.projectId },
      select: { title: true }
    })
  )?.title;

  if (projectTitle) {
    void notifyContractCompleted({
      userId: freelancerUserId,
      contractId,
      projectTitle
    });
    void notifyContractCompleted({
      userId: clientUserId,
      contractId,
      projectTitle
    });
  }

  return { ok: true, data: { contractId } };
}

/** Called from proposal acceptance — creates escrow + default milestone. */
export async function initializeContractWorkflow(
  tx: Prisma.TransactionClient,
  params: {
    contractId: string;
    agreedAmount: Prisma.Decimal;
    currency: string;
    deliveryDays: number | null;
    deliveryTerms: string | null;
  }
) {
  await tx.contract.update({
    where: { id: params.contractId },
    data: {
      deliveryDays: params.deliveryDays,
      deliveryTerms: params.deliveryTerms
    }
  });

  await tx.escrow.create({
    data: {
      contractId: params.contractId,
      status: EscrowStatus.AWAITING_FUNDING,
      currency: params.currency
    }
  });

  const dueDate =
    params.deliveryDays != null
      ? new Date(Date.now() + params.deliveryDays * 24 * 60 * 60 * 1000)
      : null;

  await tx.contractMilestone.create({
    data: {
      contractId: params.contractId,
      title: "Project delivery",
      description: "Full contract deliverable per accepted proposal",
      amount: params.agreedAmount,
      currency: params.currency,
      dueDate,
      sortOrder: 0,
      status: MilestoneStatus.PENDING
    }
  });
}
