import "server-only";

import { prisma } from "@/lib/db";

export function buildDirectKey(userIdA: string, userIdB: string) {
  const [a, b] = [userIdA, userIdB].sort();
  return `${a}:${b}`;
}

export async function canUserMessageTarget(senderId: string, targetUserId: string) {
  if (senderId === targetUserId) return { ok: false as const, error: "Cannot message yourself" };

  const [sender, target] = await Promise.all([
    prisma.user.findUnique({
      where: { id: senderId },
      select: { accountStatus: true, allowMessagesFromEveryone: true }
    }),
    prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, accountStatus: true, allowMessagesFromEveryone: true }
    })
  ]);

  if (!sender || !target) return { ok: false as const, error: "User not found" };
  if (sender.accountStatus !== "ACTIVE" || target.accountStatus !== "ACTIVE") {
    return { ok: false as const, error: "Messaging unavailable" };
  }
  if (!target.allowMessagesFromEveryone) {
    return { ok: false as const, error: "This user does not accept messages from everyone" };
  }

  return { ok: true as const };
}

export async function ensureDirectConversation(senderId: string, targetUserId: string) {
  const allowed = await canUserMessageTarget(senderId, targetUserId);
  if (!allowed.ok) return { ok: false as const, error: allowed.error };

  const directKey = buildDirectKey(senderId, targetUserId);

  const existing = await prisma.conversation.findUnique({
    where: { directKey },
    select: { id: true }
  });
  if (existing) return { ok: true as const, conversationId: existing.id };

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { name: true }
  });

  const created = await prisma.conversation.create({
    data: {
      directKey,
      subject: `Chat with ${target?.name ?? "user"}`,
      participants: {
        create: [{ userId: senderId }, { userId: targetUserId }]
      }
    },
    select: { id: true }
  });

  return { ok: true as const, conversationId: created.id };
}
