import "server-only";

import { ProposalStatus, Role } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getClientProfileIdForUser, getFreelancerProfileIdForUser } from "@/lib/projects/service";

export type ConversationPostIntent =
  | { type: "proposal"; proposalId: string }
  | { type: "project_peer"; projectId: string; freelancerUserId: string }
  | { type: "project_self"; projectId: string }
  | { type: "directory"; freelancerUserId: string }
  | { type: "direct"; targetUserId: string };

export function parseConversationPostBody(raw: unknown): ConversationPostIntent | { error: string } {
  if (typeof raw !== "object" || raw === null) {
    return { error: "Invalid JSON" };
  }

  const proposalId =
    typeof (raw as { proposalId?: unknown }).proposalId === "string"
      ? (raw as { proposalId: string }).proposalId.trim()
      : "";

  const projectId =
    typeof (raw as { projectId?: unknown }).projectId === "string"
      ? (raw as { projectId: string }).projectId.trim()
      : "";

  const freelancerUserId =
    typeof (raw as { freelancerUserId?: unknown }).freelancerUserId === "string"
      ? (raw as { freelancerUserId: string }).freelancerUserId.trim()
      : "";

  const targetUserId =
    typeof (raw as { targetUserId?: unknown }).targetUserId === "string"
      ? (raw as { targetUserId: string }).targetUserId.trim()
      : "";

  if (proposalId) return { type: "proposal", proposalId };

  if (targetUserId) return { type: "direct", targetUserId };

  if (projectId && freelancerUserId) {
    return { type: "project_peer", projectId, freelancerUserId };
  }

  if (projectId) return { type: "project_self", projectId };

  if (freelancerUserId) return { type: "directory", freelancerUserId };

  return { error: "proposalId, projectId, or freelancerUserId required" };
}

export async function resolveProposalIdFromIntent(
  viewerUserId: string,
  role: Role,
  intent: ConversationPostIntent
): Promise<{ proposalId: string } | { error: string }> {
  if (intent.type === "proposal") {
    return { proposalId: intent.proposalId };
  }

  if (intent.type === "project_peer") {
    if (role !== Role.CLIENT) return { error: "Forbidden" };

    const clientProfileId = await getClientProfileIdForUser(viewerUserId);
    if (!clientProfileId) return { error: "Forbidden" };

    const own = await prisma.project.findFirst({
      where: { id: intent.projectId, clientId: clientProfileId },
      select: { id: true }
    });
    if (!own) return { error: "Forbidden" };

    const proposal = await prisma.proposal.findFirst({
      where: {
        projectId: intent.projectId,
        freelancer: { userId: intent.freelancerUserId }
      },
      select: { id: true }
    });

    if (!proposal) return { error: "No proposal on record for that freelancer" };

    return { proposalId: proposal.id };
  }

  if (intent.type === "project_self") {
    if (role !== Role.FREELANCER) return { error: "Forbidden" };

    const freelancerProfileId = await getFreelancerProfileIdForUser(viewerUserId);
    if (!freelancerProfileId) return { error: "Forbidden" };

    const proposal = await prisma.proposal.findFirst({
      where: {
        projectId: intent.projectId,
        freelancerId: freelancerProfileId
      },
      select: { id: true, status: true }
    });

    if (!proposal) return { error: "No proposal on record" };

    if (proposal.status === ProposalStatus.WITHDRAWN) return { error: "Proposal withdrawn" };

    return { proposalId: proposal.id };
  }

  if (intent.type === "directory") {
    return { error: "Use targetUserId for direct messaging" };
  }

  if (intent.type === "direct") {
    return { error: "Use direct conversation endpoint" };
  }

  return { error: "Unsupported intent" };
}
