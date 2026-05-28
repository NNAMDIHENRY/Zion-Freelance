import "server-only";

import type { ProposalStatus } from "@prisma/client";

import { prisma } from "@/lib/db";

const BLOCKED_FREELANCER: ProposalStatus[] = ["WITHDRAWN"];

export async function getProposalMessagingParties(userId: string, proposalId: string) {
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
    include: {
      project: {
        select: {
          title: true,
          clientId: true,
          client: { select: { userId: true } }
        }
      },
      freelancer: { select: { userId: true } }
    }
  });
  if (!proposal) return null;

  const clientUserId = proposal.project.client.userId;
  const freelancerUserId = proposal.freelancer.userId;

  if (clientUserId === userId) {
    return { proposal, clientUserId, freelancerUserId };
  }
  if (freelancerUserId === userId && !BLOCKED_FREELANCER.includes(proposal.status)) {
    return { proposal, clientUserId, freelancerUserId };
  }

  return null;
}
