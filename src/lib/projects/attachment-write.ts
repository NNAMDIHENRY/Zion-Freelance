import "server-only";

import { FilePurpose } from "@prisma/client";

import { prisma } from "@/lib/db";
import { saveUploadBuffer } from "@/lib/storage/local";

export async function insertProjectAttachmentMetadata(params: {
  projectId: string;
  clientProfileId: string;
  userId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  buffer?: Buffer;
}) {
  const own = await prisma.project.findFirst({
    where: { id: params.projectId, clientId: params.clientProfileId },
    select: { id: true }
  });
  if (!own) return { ok: false as const, error: "Not found" };

  const maxBytes = 15 * 1024 * 1024;
  if (params.sizeBytes <= 0 || params.sizeBytes > maxBytes) {
    return { ok: false as const, error: "Invalid file size" };
  }

  let storageKey: string;
  if (params.buffer) {
    const saved = await saveUploadBuffer({
      buffer: params.buffer,
      mimeType: params.mimeType,
      originalName: params.originalName
    });
    storageKey = saved.storageKey;
  } else {
    return { ok: false as const, error: "File data required" };
  }

  const row = await prisma.fileUpload.create({
    data: {
      purpose: FilePurpose.PROJECT_BRIEF,
      storageKey,
      originalName: params.originalName.slice(0, 512),
      mimeType: params.mimeType.slice(0, 128) || "application/octet-stream",
      sizeBytes: params.sizeBytes,
      uploadedByUserId: params.userId,
      projectId: params.projectId
    },
    select: { id: true }
  });

  return { ok: true as const, id: row.id };
}
