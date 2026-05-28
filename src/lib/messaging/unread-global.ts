import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

export async function countUnreadInboundMessages(viewerId: string) {
  const row = await prisma.$queryRaw<[{ unread: bigint }]>(Prisma.sql`
SELECT COUNT(*)::bigint AS unread
FROM "Message" m
INNER JOIN "ConversationParticipant" p
  ON p."conversationId" = m."conversationId" AND p."userId" = ${viewerId}
WHERE m."senderId" <> ${viewerId}
  AND m."createdAt" > COALESCE(p."lastReadAt", TIMESTAMP 'epoch')
`);
  const n = Number(row[0]?.unread ?? 0);
  return Number.isFinite(n) ? n : 0;
}
