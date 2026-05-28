import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { assertConversationParticipant } from "@/lib/messaging/conversations-core";
import { msgInclude, serializeMessage } from "@/lib/messaging/message-serialize";

type RouteCtx = { params: Promise<{ conversationId: string; messageId: string }> };

export async function DELETE(_req: Request, ctx: RouteCtx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { conversationId, messageId } = await ctx.params;

  const member = await assertConversationParticipant(conversationId, userId);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const msg = await prisma.message.findFirst({
    where: { id: messageId, conversationId },
    select: { id: true, senderId: true, isDeleted: true, content: true }
  });
  if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (msg.senderId !== userId) {
    return NextResponse.json({ error: "Only the sender can delete this message" }, { status: 403 });
  }
  if (msg.isDeleted) {
    return NextResponse.json({ ok: true });
  }

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedById: userId
    },
    include: msgInclude
  });

  return NextResponse.json({ message: serializeMessage(updated) });
}
