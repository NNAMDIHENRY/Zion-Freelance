import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { assertConversationParticipant } from "@/lib/messaging/conversations-core";

type RouteCtx = { params: Promise<{ conversationId: string }> };

export async function POST(_req: Request, ctx: RouteCtx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { conversationId } = await ctx.params;

  const member = await assertConversationParticipant(conversationId, userId);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.conversationParticipant.update({
    where: {
      conversationId_userId: { conversationId, userId }
    },
    data: { typingAt: new Date() }
  });

  return NextResponse.json({ ok: true });
}
