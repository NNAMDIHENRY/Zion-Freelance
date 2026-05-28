import "server-only";

import { FilePurpose } from "@prisma/client";

import { prisma } from "@/lib/db";
import { saveUploadBuffer } from "@/lib/storage/local";
import {
  JOB_ATTACHMENT_MAX_BYTES,
  JOB_CV_MAX_BYTES,
  sanitizeUploadFilename,
  validateJobUpload
} from "@/lib/jobs/upload-policy";

export async function insertJobAttachment(params: {
  jobId: string;
  posterId: string;
  userId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  buffer: Buffer;
}) {
  const own = await prisma.job.findFirst({
    where: { id: params.jobId, posterId: params.posterId },
    select: { id: true }
  });
  if (!own) return { ok: false as const, error: "Not found" };

  const valid = validateJobUpload({
    mimeType: params.mimeType,
    sizeBytes: params.sizeBytes,
    originalName: params.originalName,
    maxBytes: JOB_ATTACHMENT_MAX_BYTES
  });
  if (!valid.ok) return { ok: false as const, error: valid.error };

  const saved = await saveUploadBuffer({
    buffer: params.buffer,
    mimeType: params.mimeType,
    originalName: params.originalName
  });

  const row = await prisma.fileUpload.create({
    data: {
      purpose: FilePurpose.JOB_ATTACHMENT,
      storageKey: saved.storageKey,
      originalName: sanitizeUploadFilename(params.originalName),
      mimeType: params.mimeType.slice(0, 128) || "application/octet-stream",
      sizeBytes: params.sizeBytes,
      uploadedByUserId: params.userId,
      jobId: params.jobId
    },
    select: { id: true }
  });

  return { ok: true as const, id: row.id };
}

export async function insertJobApplicationFile(params: {
  applicationId: string;
  applicantId: string;
  userId: string;
  purpose: "JOB_APPLICATION_CV" | "JOB_APPLICATION_ATTACHMENT";
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  buffer: Buffer;
}) {
  const app = await prisma.jobApplication.findFirst({
    where: { id: params.applicationId, applicantId: params.applicantId },
    select: { id: true, jobId: true }
  });
  if (!app) return { ok: false as const, error: "Not found" };

  const maxBytes = params.purpose === "JOB_APPLICATION_CV" ? JOB_CV_MAX_BYTES : JOB_ATTACHMENT_MAX_BYTES;
  const valid = validateJobUpload({
    mimeType: params.mimeType,
    sizeBytes: params.sizeBytes,
    originalName: params.originalName,
    maxBytes
  });
  if (!valid.ok) return { ok: false as const, error: valid.error };

  const saved = await saveUploadBuffer({
    buffer: params.buffer,
    mimeType: params.mimeType,
    originalName: params.originalName
  });

  const filePurpose =
    params.purpose === "JOB_APPLICATION_CV"
      ? FilePurpose.JOB_APPLICATION_CV
      : FilePurpose.JOB_APPLICATION_ATTACHMENT;

  const row = await prisma.fileUpload.create({
    data: {
      purpose: filePurpose,
      storageKey: saved.storageKey,
      originalName: sanitizeUploadFilename(params.originalName),
      mimeType: params.mimeType.slice(0, 128) || "application/octet-stream",
      sizeBytes: params.sizeBytes,
      uploadedByUserId: params.userId,
      jobApplicationId: params.applicationId
    },
    select: { id: true }
  });

  if (params.purpose === "JOB_APPLICATION_CV") {
    await prisma.jobApplication.update({
      where: { id: params.applicationId },
      data: { resumeFileId: row.id }
    });
  }

  return { ok: true as const, id: row.id };
}
