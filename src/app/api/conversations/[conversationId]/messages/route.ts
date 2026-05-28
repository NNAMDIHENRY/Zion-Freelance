import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import {
  assertConversationParticipant,
  conversationPeerSelect
} from "@/lib/messaging/conversations-core";
import {
  normalizeAttachmentRows,
  persistMessageAttachments
} from "@/lib/messaging/message-attachments";
import { msgInclude, serializeMessage } from "@/lib/messaging/message-serialize";
import { createMessageNotification } from "@/lib/notifications/service";

const TYPING_MS = 6500;

type RouteCtx = { params: Promise<{ conversationId: string }> };

export async function GET(req: Request, ctx: RouteCtx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { conversationId } = await ctx.params;

  const member = await assertConversationParticipant(conversationId, userId);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const afterCreatedAt = url.searchParams.get("afterCreatedAt");

  const take = Math.min(Number(url.searchParams.get("take") ?? "48") || 48, 120);
  const beforeMessageId = url.searchParams.get("beforeMessageId");

  if (afterCreatedAt) {
    const afterDate = new Date(afterCreatedAt);
    if (Number.isNaN(afterDate.getTime())) {
      return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
    }

    const newer = await prisma.message.findMany({
      where: {
        conversationId,
        createdAt: { gt: afterDate }
      },
      orderBy: { createdAt: "asc" },
      include: msgInclude
    });

    const peerRow = await conversationPeerSelect(conversationId, userId);
    const now = Date.now();
    const peerTyping =
      !!peerRow?.typingAt && now - peerRow.typingAt.getTime() <= TYPING_MS;

    return NextResponse.json({
      messages: newer.map(serializeMessage),
      peerTyping
    });
  }

  let cursorCreatedAt: Date | undefined;
  if (beforeMessageId) {
    const cursor = await prisma.message.findFirst({
      where: { id: beforeMessageId, conversationId },
      select: { createdAt: true }
    });
    if (!cursor) {
      return NextResponse.json({ error: "Cursor not found" }, { status: 400 });
    }
    cursorCreatedAt = cursor.createdAt;
  }

  const older = await prisma.message.findMany({
    where: {
      conversationId,
      ...(cursorCreatedAt
        ? {
            createdAt: { lt: cursorCreatedAt }
          }
        : {})
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
    include: msgInclude
  });

  older.reverse();

  const peerRow = await conversationPeerSelect(conversationId, userId);
  const now = Date.now();
  const peerTyping = !!peerRow?.typingAt && now - peerRow.typingAt.getTime() <= TYPING_MS;

  return NextResponse.json({
    messages: older.map(serializeMessage),
    peerTyping
  });
}

export async function POST(req: Request, ctx: RouteCtx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { conversationId } = await ctx.params;

  const member = await assertConversationParticipant(conversationId, userId);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const ct = req.headers.get("content-type") ?? "";
  let contentTrimmed = "";
  let files: File[] = [];

  if (ct.includes("multipart/form-data")) {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const text = formData.get("content");
    contentTrimmed = typeof text === "string" ? text.trim().slice(0, 8000) : "";

    files = formData.getAll("files").filter((f): f is File => f instanceof File);
  } else {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    contentTrimmed =
      typeof body === "object" &&
      body !== null &&
      typeof (body as { content?: unknown }).content === "string"
        ? (body as { content: string }).content.trim().slice(0, 8000)
        : "";
    files = [];
  }

  const parsedFiles = normalizeAttachmentRows(files);

  if (!parsedFiles.ok) {
    return NextResponse.json({ error: parsedFiles.error }, { status: 400 });
  }

  if (!contentTrimmed && parsedFiles.rows.length === 0) {
    return NextResponse.json({ error: "Empty message" }, { status: 400 });
  }

  const participants = await prisma.conversationParticipant.findMany({
    where: { conversationId },
    select: { userId: true }
  });
  if (participants.length !== 2) {
    return NextResponse.json({ error: "Invalid conversation shape" }, { status: 500 });
  }

  const recipientId = participants.find((p) => p.userId !== userId)?.userId;

  const persistContent = contentTrimmed.length > 0 ? contentTrimmed : " ";

  let createdMsgId: string;

  let attachmentCreates: Awaited<ReturnType<typeof persistMessageAttachments>> = [];
  if (parsedFiles.rows.length > 0) {
    try {
      attachmentCreates = await persistMessageAttachments(
        "",
        userId,
        files,
        parsedFiles
      );
    } catch {
      return NextResponse.json({ error: "Failed to store attachments" }, { status: 500 });
    }
  }

  try {
    createdMsgId = await prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          conversationId,
          senderId: userId,
          content: persistContent
        },
        select: { id: true }
      });

      if (attachmentCreates.length > 0) {
        await tx.fileUpload.createMany({
          data: attachmentCreates.map((row) => ({ ...row, messageId: msg.id }))
        });
      }

      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      });

      await tx.conversationParticipant.update({
        where: {
          conversationId_userId: { conversationId, userId }
        },
        data: { typingAt: null }
      });

      return msg.id;
    });
  } catch {
    return NextResponse.json({ error: "Failed to persist" }, { status: 500 });
  }

  const senderRow = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true }
  });

  const snippet =
    contentTrimmed.length > 0 ? contentTrimmed : parsedFiles.rows.length ? "Sent attachments" : "Message";

  if (recipientId) {
    await createMessageNotification({
      recipientUserId: recipientId,
      senderName: senderRow?.name ?? "Someone",
      conversationId,
      snippet
    }).catch(() => undefined);
  }

  const hydrated = await prisma.message.findUniqueOrThrow({
    where: { id: createdMsgId },
    include: msgInclude
  });

  return NextResponse.json({ message: serializeMessage(hydrated) }, { status: 201 });
}
