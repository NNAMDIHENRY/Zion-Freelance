import "server-only";

import { FilePurpose } from "@prisma/client";
import { randomUUID } from "crypto";

import { prisma } from "@/lib/db";

export async function insertProjectAttachmentMetadata(params: {
  projectId: string;
  clientProfileId: string;
  userId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
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

  const row = await prisma.fileUpload.create({
    data: {
      purpose: FilePurpose.PROJECT_BRIEF,
      storageKey: `metadata:${randomUUID()}`,
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
