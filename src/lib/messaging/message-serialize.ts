import type { Prisma } from "@prisma/client";

export const DELETED_MESSAGE_LABEL = "This message was deleted";

export const msgInclude = {
  attachments: {
    select: {
      id: true,
      originalName: true,
      mimeType: true,
      sizeBytes: true
    }
  },
  sender: { select: { id: true, name: true } }
} satisfies Prisma.MessageInclude;

export type LoadedMessage = Prisma.MessageGetPayload<{ include: typeof msgInclude }>;

export function serializeMessage(row: LoadedMessage) {
  const deleted = row.isDeleted;
  return {
    id: row.id,
    content: deleted ? DELETED_MESSAGE_LABEL : row.content.trim(),
    isDeleted: deleted,
    senderId: row.senderId,
    createdAt: row.createdAt.toISOString(),
    senderName: row.sender.name,
    attachments: deleted
      ? []
      : row.attachments.map((a) => ({
          id: a.id,
          name: a.originalName,
          mimeType: a.mimeType,
          sizeBytes: a.sizeBytes
        }))
  };
}

export function previewForMessage(content: string, isDeleted: boolean) {
  if (isDeleted) return DELETED_MESSAGE_LABEL;
  const text = content.trim();
  return text.length > 0 ? text : "Attachment";
}
