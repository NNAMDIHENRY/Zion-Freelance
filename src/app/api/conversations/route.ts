import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import {
  ensureConversationForProposal,
  unreadCountsForConversations
} from "@/lib/messaging/conversations-core";
import {
  parseConversationPostBody,
  resolveProposalIdFromIntent
} from "@/lib/messaging/conversation-request";
import { ensureDirectConversation } from "@/lib/messaging/direct-conversation";
import { previewForMessage } from "@/lib/messaging/message-serialize";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: { some: { userId } }
    },
    orderBy: { updatedAt: "desc" },
    take: 80,
    include: {
      proposal: {
        select: {
          id: true,
          project: {
            select: { title: true }
          }
        }
      },
      participants: {
        select: {
          userId: true,
          typingAt: true,
          user: { select: { id: true, name: true, email: true } }
        }
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          content: true,
          createdAt: true,
          senderId: true,
          isDeleted: true
        }
      }
    }
  });

  const ids = conversations.map((c) => c.id);
  const unreadMap = await unreadCountsForConversations(ids, userId);

  const body = conversations.map((c) => {
    const peer = c.participants.find((p) => p.userId !== userId)?.user;
    const last = c.messages[0];
    return {
      id: c.id,
      proposalId: c.proposal?.id ?? "",
      projectTitle: c.proposal?.project.title ?? c.subject ?? "Direct message",
      peer: peer ?? { id: "", name: "Participant", email: "" },
      lastMessagePreview: last
        ? previewForMessage(last.content, last.isDeleted)
        : "",
      lastMessageAt: last?.createdAt.toISOString() ?? null,
      lastMessageSenderId: last?.senderId ?? null,
      unread: unreadMap.get(c.id) ?? 0
    };
  });

  return NextResponse.json({ conversations: body });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const intent = parseConversationPostBody(parsed);
  if ("error" in intent) {
    return NextResponse.json({ error: intent.error }, { status: 400 });
  }

  if (intent.type === "direct") {
    const ensured = await ensureDirectConversation(session.user.id, intent.targetUserId);
    if (!ensured.ok) {
      return NextResponse.json({ error: ensured.error }, { status: 403 });
    }
    return NextResponse.json({ conversationId: ensured.conversationId }, { status: 200 });
  }

  const resolved = await resolveProposalIdFromIntent(
    session.user.id,
    session.user.role,
    intent
  );

  if ("error" in resolved) {
    const code = resolved.error === "Forbidden" ? 403 : 404;
    return NextResponse.json({ error: resolved.error }, { status: code });
  }

  const ensured = await ensureConversationForProposal({
    userId: session.user.id,
    proposalId: resolved.proposalId
  });

  if (!ensured.ok) {
    return NextResponse.json({ error: ensured.error }, { status: 403 });
  }

  return NextResponse.json({ conversationId: ensured.conversationId }, { status: 200 });
}
