import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

import { getProposalMessagingParties } from "./proposal-access";

export async function ensureConversationForProposal(params: {
  userId: string;
  proposalId: string;
}) {
  const parties = await getProposalMessagingParties(params.userId, params.proposalId);
  if (!parties) return { ok: false as const, error: "Forbidden" };

  const { proposal, clientUserId, freelancerUserId } = parties;

  return prisma.$transaction(async (tx) => {
    const existing = await tx.conversation.findUnique({
      where: { proposalId: proposal.id },
      select: {
        id: true,
        updatedAt: true,
        proposal: {
          select: {
            project: { select: { title: true } }
          }
        }
      }
    });
    if (existing) return { ok: true as const, conversationId: existing.id };

    const created = await tx.conversation.create({
      data: {
        proposalId: proposal.id,
        projectId: proposal.projectId,
        subject: `${parties.proposal.project.title}`,
        participants: {
          create: [{ userId: clientUserId }, { userId: freelancerUserId }]
        }
      },
      select: { id: true }
    });

    return { ok: true as const, conversationId: created.id };
  });
}

export async function unreadCountsForConversations(conversationIds: string[], viewerId: string) {
  if (conversationIds.length === 0) return new Map<string, number>();

  const rows = await prisma.$queryRaw<Array<{ cid: string; unread: bigint }>>(Prisma.sql`
    SELECT m."conversationId" AS cid, COUNT(*)::bigint AS unread
    FROM "Message" m
    INNER JOIN "ConversationParticipant" p
      ON p."conversationId" = m."conversationId" AND p."userId" = ${viewerId}
    WHERE m."conversationId" IN (${Prisma.join(
      conversationIds.map((id) => Prisma.sql`${id}`)
    )})
      AND m."senderId" <> ${viewerId}
      AND m."createdAt" > COALESCE(p."lastReadAt", TIMESTAMP 'epoch')
    GROUP BY m."conversationId"
  `);

  const map = new Map<string, number>();
  for (const row of rows) map.set(row.cid, Number(row.unread));

  return map;
}

export async function conversationPeerSelect(conversationId: string, viewerId: string) {
  return prisma.conversationParticipant.findFirst({
    where: {
      conversationId,
      userId: { not: viewerId }
    },
    select: {
      user: { select: { id: true, name: true, email: true } },
      typingAt: true
    }
  });
}

export async function assertConversationParticipant(conversationId: string, userId: string) {
  return prisma.conversationParticipant.findFirst({
    where: { conversationId, userId },
    select: { id: true, lastReadAt: true }
  });
}
