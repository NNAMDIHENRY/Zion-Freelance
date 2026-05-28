import "server-only";

import {
  ContractStatus,
  Prisma,
  ProjectModerationStatus,
  ProjectStatus,
  ProposalStatus,
  Role
} from "@prisma/client";

import { initializeContractWorkflow } from "@/lib/contracts/service";
import { prisma } from "@/lib/db";
import {
  notifyProposalAccepted,
  notifyProposalRejected,
  notifyProposalSubmitted
} from "@/lib/notifications/workflow-events";
import { getClientProfileIdForUser, getFreelancerProfileIdForUser } from "@/lib/projects/service";

import type { ProposalWriteInput } from "@/lib/validators/proposal";

export type ProposalServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code: ProposalServiceErrorCode };

export type ProposalServiceErrorCode =
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "CONFLICT"
  | "BAD_STATE";

const proposalListInclude = {
  project: {
    select: {
      id: true,
      title: true,
      currency: true,
      status: true,
      client: { select: { userId: true } }
    }
  },
  freelancer: {
    select: {
      id: true,
      user: { select: { id: true, name: true, email: true } }
    }
  }
} as const;

export type FreelancerProposalListItem = Prisma.ProposalGetPayload<{
  include: typeof proposalListInclude;
}>;

export type ProjectProposalListItem = FreelancerProposalListItem;

function err<T>(
  error: string,
  code: ProposalServiceErrorCode
): ProposalServiceResult<T> {
  return { ok: false, error, code };
}

export async function listOpenProjectsForFreelancer(userId: string, take = 40) {
  return prisma.project.findMany({
    where: {
      status: ProjectStatus.OPEN,
      client: { userId: { not: userId } }
    },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      title: true,
      budgetMin: true,
      budgetMax: true,
      currency: true,
      deadline: true,
      category: { select: { name: true } }
    }
  });
}

export async function getOpenProjectForFreelancerProposal(
  projectId: string,
  freelancerUserId: string
): Promise<
  ProposalServiceResult<{
    id: string;
    title: string;
    description: string;
    budgetMin: Prisma.Decimal | null;
    budgetMax: Prisma.Decimal | null;
    currency: string;
    deadline: Date | null;
    category: { name: string } | null;
    skills: { skill: { name: string } }[];
  }>
> {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      status: ProjectStatus.OPEN,
      moderationStatus: ProjectModerationStatus.ACTIVE
    },
    include: {
      client: { select: { userId: true } },
      category: { select: { name: true } },
      skills: { include: { skill: { select: { name: true } } } }
    }
  });
  if (!project) return err("Project not found or not open for proposals", "NOT_FOUND");
  if (project.client.userId === freelancerUserId) {
    return err("You cannot propose on your own project", "FORBIDDEN");
  }
  const { client: _c, ...rest } = project;
  return {
    ok: true,
    data: {
      id: rest.id,
      title: rest.title,
      description: rest.description,
      budgetMin: rest.budgetMin,
      budgetMax: rest.budgetMax,
      currency: rest.currency,
      deadline: rest.deadline,
      category: rest.category,
      skills: rest.skills
    }
  };
}

export async function submitProposal(
  userId: string,
  role: Role,
  projectId: string,
  input: ProposalWriteInput
): Promise<ProposalServiceResult<{ id: string }>> {
  if (role !== Role.FREELANCER) return err("Only freelancers can submit proposals", "FORBIDDEN");
  const freelancerProfileId = await getFreelancerProfileIdForUser(userId);
  if (!freelancerProfileId) return err("Freelancer profile required", "FORBIDDEN");

  const projectCheck = await getOpenProjectForFreelancerProposal(projectId, userId);
  if (!projectCheck.ok) return projectCheck;

  const proposedPrice = new Prisma.Decimal(input.proposedPrice);
  const existing = await prisma.proposal.findUnique({
    where: {
      projectId_freelancerId: { projectId, freelancerId: freelancerProfileId }
    },
    select: { id: true, status: true }
  });

  if (existing) {
    if (
      existing.status === ProposalStatus.PENDING ||
      existing.status === ProposalStatus.REVIEWED
    ) {
      return err("You already have an active proposal for this project", "CONFLICT");
    }
    if (existing.status === ProposalStatus.ACCEPTED) {
      return err("This proposal was already accepted", "CONFLICT");
    }
    await prisma.proposal.update({
      where: { id: existing.id },
      data: {
        proposedPrice,
        coverLetter: input.coverLetter,
        deliveryDays: input.deliveryDays,
        status: ProposalStatus.PENDING,
        withdrawnAt: null,
        currency: projectCheck.data.currency
      }
    });
    return { ok: true, data: { id: existing.id } };
  }

  const created = await prisma.proposal.create({
    data: {
      projectId,
      freelancerId: freelancerProfileId,
      proposedPrice,
      coverLetter: input.coverLetter,
      deliveryDays: input.deliveryDays,
      currency: projectCheck.data.currency,
      status: ProposalStatus.PENDING
    },
    select: { id: true }
  });

  const meta = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      title: true,
      client: { select: { userId: true } },
      proposals: {
        where: { id: created.id },
        select: { freelancer: { select: { user: { select: { name: true } } } } }
      }
    }
  });
  if (meta?.client.userId) {
    const freelancerName = meta.proposals[0]?.freelancer.user.name ?? "A freelancer";
    void notifyProposalSubmitted({
      clientUserId: meta.client.userId,
      projectId,
      projectTitle: meta.title,
      proposalId: created.id,
      freelancerName
    });
  }

  return { ok: true, data: { id: created.id } };
}

export async function updateProposal(
  userId: string,
  role: Role,
  proposalId: string,
  input: ProposalWriteInput
): Promise<ProposalServiceResult<{ id: string }>> {
  if (role !== Role.FREELANCER) return err("Only freelancers can update proposals", "FORBIDDEN");
  const freelancerProfileId = await getFreelancerProfileIdForUser(userId);
  if (!freelancerProfileId) return err("Freelancer profile required", "FORBIDDEN");

  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, freelancerId: freelancerProfileId },
    select: { id: true, status: true }
  });
  if (!proposal) return err("Proposal not found", "NOT_FOUND");
  if (proposal.status !== ProposalStatus.PENDING) {
    return err("Only pending proposals can be edited", "BAD_STATE");
  }

  const proposedPrice = new Prisma.Decimal(input.proposedPrice);
  await prisma.proposal.update({
    where: { id: proposal.id },
    data: {
      proposedPrice,
      coverLetter: input.coverLetter,
      deliveryDays: input.deliveryDays
    }
  });
  return { ok: true, data: { id: proposal.id } };
}

export async function withdrawProposal(
  userId: string,
  role: Role,
  proposalId: string
): Promise<ProposalServiceResult<{ id: string }>> {
  if (role !== Role.FREELANCER) return err("Only freelancers can withdraw proposals", "FORBIDDEN");
  const freelancerProfileId = await getFreelancerProfileIdForUser(userId);
  if (!freelancerProfileId) return err("Freelancer profile required", "FORBIDDEN");

  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, freelancerId: freelancerProfileId },
    select: { id: true, status: true }
  });
  if (!proposal) return err("Proposal not found", "NOT_FOUND");
  if (
    proposal.status !== ProposalStatus.PENDING &&
    proposal.status !== ProposalStatus.REVIEWED
  ) {
    return err("This proposal cannot be withdrawn", "BAD_STATE");
  }

  const now = new Date();
  await prisma.proposal.update({
    where: { id: proposal.id },
    data: { status: ProposalStatus.WITHDRAWN, withdrawnAt: now }
  });
  return { ok: true, data: { id: proposal.id } };
}

export async function listFreelancerProposals(
  userId: string,
  role: Role
): Promise<ProposalServiceResult<FreelancerProposalListItem[]>> {
  if (role !== Role.FREELANCER) return err("Forbidden", "FORBIDDEN");
  const freelancerProfileId = await getFreelancerProfileIdForUser(userId);
  if (!freelancerProfileId) return err("Freelancer profile required", "FORBIDDEN");

  const rows = await prisma.proposal.findMany({
    where: { freelancerId: freelancerProfileId },
    orderBy: { createdAt: "desc" },
    include: proposalListInclude
  });
  return { ok: true, data: rows };
}

export async function listProjectProposals(
  userId: string,
  role: Role,
  projectId: string
): Promise<ProposalServiceResult<ProjectProposalListItem[]>> {
  if (role !== Role.CLIENT) return err("Only clients can review project proposals", "FORBIDDEN");
  const clientProfileId = await getClientProfileIdForUser(userId);
  if (!clientProfileId) return err("Client profile required", "FORBIDDEN");

  const project = await prisma.project.findFirst({
    where: { id: projectId, clientId: clientProfileId },
    select: { id: true }
  });
  if (!project) return err("Project not found", "NOT_FOUND");

  const rows = await prisma.proposal.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    include: proposalListInclude
  });
  return { ok: true, data: rows };
}

export async function reviewProposal(
  userId: string,
  role: Role,
  proposalId: string
): Promise<ProposalServiceResult<{ id: string }>> {
  if (role !== Role.CLIENT) return err("Forbidden", "FORBIDDEN");
  const clientProfileId = await getClientProfileIdForUser(userId);
  if (!clientProfileId) return err("Client profile required", "FORBIDDEN");

  const proposal = await prisma.proposal.findFirst({
    where: {
      id: proposalId,
      project: { clientId: clientProfileId }
    },
    select: { id: true, status: true }
  });
  if (!proposal) return err("Proposal not found", "NOT_FOUND");
  if (proposal.status !== ProposalStatus.PENDING) {
    if (proposal.status === ProposalStatus.REVIEWED) {
      return { ok: true, data: { id: proposal.id } };
    }
    return err("Only pending proposals can be marked reviewed", "BAD_STATE");
  }

  await prisma.proposal.update({
    where: { id: proposal.id },
    data: { status: ProposalStatus.REVIEWED }
  });
  return { ok: true, data: { id: proposal.id } };
}

export async function rejectProposal(
  userId: string,
  role: Role,
  proposalId: string
): Promise<ProposalServiceResult<{ id: string }>> {
  if (role !== Role.CLIENT) return err("Forbidden", "FORBIDDEN");
  const clientProfileId = await getClientProfileIdForUser(userId);
  if (!clientProfileId) return err("Client profile required", "FORBIDDEN");

  const proposal = await prisma.proposal.findFirst({
    where: {
      id: proposalId,
      project: { clientId: clientProfileId }
    },
    select: { id: true, status: true }
  });
  if (!proposal) return err("Proposal not found", "NOT_FOUND");
  if (
    proposal.status !== ProposalStatus.PENDING &&
    proposal.status !== ProposalStatus.REVIEWED
  ) {
    return err("This proposal cannot be rejected", "BAD_STATE");
  }

  const detail = await prisma.proposal.findUnique({
    where: { id: proposal.id },
    select: {
      id: true,
      project: { select: { title: true } },
      freelancer: { select: { userId: true } }
    }
  });

  await prisma.proposal.update({
    where: { id: proposal.id },
    data: { status: ProposalStatus.REJECTED }
  });

  if (detail?.freelancer.userId) {
    void notifyProposalRejected({
      freelancerUserId: detail.freelancer.userId,
      proposalId: detail.id,
      projectTitle: detail.project.title
    });
  }

  return { ok: true, data: { id: proposal.id } };
}

export async function acceptProposal(
  userId: string,
  role: Role,
  proposalId: string
): Promise<ProposalServiceResult<{ proposalId: string; contractId: string; projectId: string }>> {
  if (role !== Role.CLIENT) return err("Forbidden", "FORBIDDEN");
  const clientProfileId = await getClientProfileIdForUser(userId);
  if (!clientProfileId) return err("Client profile required", "FORBIDDEN");

  const proposal = await prisma.proposal.findFirst({
    where: {
      id: proposalId,
      project: { clientId: clientProfileId }
    },
    include: {
      project: {
        select: {
          id: true,
          title: true,
          contract: { select: { id: true } }
        }
      },
      freelancer: { select: { userId: true } }
    }
  });
  if (!proposal) return err("Proposal not found", "NOT_FOUND");
  if (proposal.project.contract) {
    return err("This project already has an active contract", "CONFLICT");
  }
  if (
    proposal.status !== ProposalStatus.PENDING &&
    proposal.status !== ProposalStatus.REVIEWED
  ) {
    return err("This proposal cannot be accepted", "BAD_STATE");
  }

  const rejectedBefore = await prisma.proposal.findMany({
    where: {
      projectId: proposal.projectId,
      id: { not: proposal.id },
      status: { in: [ProposalStatus.PENDING, ProposalStatus.REVIEWED] }
    },
    select: { id: true, freelancer: { select: { userId: true } } }
  });

  const result = await prisma.$transaction(async (tx) => {
    await tx.proposal.updateMany({
      where: {
        projectId: proposal.projectId,
        id: { not: proposal.id },
        status: { in: [ProposalStatus.PENDING, ProposalStatus.REVIEWED] }
      },
      data: { status: ProposalStatus.REJECTED }
    });

    await tx.proposal.update({
      where: { id: proposal.id },
      data: { status: ProposalStatus.ACCEPTED, withdrawnAt: null }
    });

    await tx.project.update({
      where: { id: proposal.projectId },
      data: { status: ProjectStatus.IN_PROGRESS }
    });

    const contract = await tx.contract.create({
      data: {
        projectId: proposal.projectId,
        proposalId: proposal.id,
        agreedAmount: proposal.proposedPrice,
        currency: proposal.currency,
        status: ContractStatus.PENDING
      },
      select: { id: true }
    });

    await initializeContractWorkflow(tx, {
      contractId: contract.id,
      agreedAmount: proposal.proposedPrice,
      currency: proposal.currency,
      deliveryDays: proposal.deliveryDays,
      deliveryTerms: proposal.coverLetter.slice(0, 500)
    });

    return {
      proposalId: proposal.id,
      contractId: contract.id,
      projectId: proposal.projectId
    };
  });

  void notifyProposalAccepted({
    freelancerUserId: proposal.freelancer.userId,
    proposalId: result.proposalId,
    contractId: result.contractId,
    projectTitle: proposal.project.title
  });

  for (const other of rejectedBefore) {
    if (other.freelancer.userId === proposal.freelancer.userId) continue;
    void notifyProposalRejected({
      freelancerUserId: other.freelancer.userId,
      proposalId: other.id,
      projectTitle: proposal.project.title
    });
  }

  return { ok: true, data: result };
}

export type ProposalDetailPayload = Prisma.ProposalGetPayload<{
  include: {
    project: {
      select: {
        id: true;
        title: true;
        status: true;
        currency: true;
        client: { select: { userId: true } };
      };
    };
    freelancer: {
      select: {
        id: true;
        user: { select: { id: true; name: true; email: true } };
      };
    };
    contract: { select: { id: true; status: true } };
  };
}>;

export async function getProposalDetailForUser(
  userId: string,
  role: Role,
  proposalId: string
): Promise<ProposalServiceResult<ProposalDetailPayload>> {
  const row = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      project: {
        select: {
          id: true,
          title: true,
          status: true,
          currency: true,
          client: { select: { userId: true } }
        }
      },
      freelancer: {
        select: {
          id: true,
          user: { select: { id: true, name: true, email: true } }
        }
      },
      contract: { select: { id: true, status: true } }
    }
  });
  if (!row) return err("Proposal not found", "NOT_FOUND");

  const isClientOwner = role === Role.CLIENT && row.project.client.userId === userId;
  const isAuthor =
    role === Role.FREELANCER && row.freelancer.user.id === userId;

  if (!isClientOwner && !isAuthor) {
    return err("You do not have access to this proposal", "FORBIDDEN");
  }

  return { ok: true, data: row };
}

export async function getFreelancerProposalContentForProject(
  userId: string,
  role: Role,
  projectId: string
): Promise<
  ProposalServiceResult<{
    id: string;
    status: ProposalStatus;
    proposedPrice: Prisma.Decimal;
    coverLetter: string;
    deliveryDays: number | null;
    currency: string;
  } | null>
> {
  if (role !== Role.FREELANCER) return { ok: true, data: null };
  const freelancerProfileId = await getFreelancerProfileIdForUser(userId);
  if (!freelancerProfileId) return { ok: true, data: null };

  const row = await prisma.proposal.findUnique({
    where: {
      projectId_freelancerId: { projectId, freelancerId: freelancerProfileId }
    },
    select: {
      id: true,
      status: true,
      proposedPrice: true,
      coverLetter: true,
      deliveryDays: true,
      currency: true
    }
  });
  return { ok: true, data: row };
}
