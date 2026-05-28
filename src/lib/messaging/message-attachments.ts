import "server-only";

import { FilePurpose } from "@prisma/client";

import { saveUploadBuffer } from "@/lib/storage/local";

const MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_CHECKS: Array<(m: string) => boolean> = [
  (m) => m.startsWith("image/"),
  (m) => m === "application/pdf",
  (m) => m === "application/msword",
  (m) =>
    m === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

function isAllowedMime(mime: string) {
  const m = mime.toLowerCase();
  return ALLOWED_CHECKS.some((fn) => fn(m));
}

export function normalizeAttachmentRows(originals: Pick<File, "name" | "type" | "size">[]) {
  if (originals.length > 6) {
    return { ok: false as const, error: "Too many attachments" };
  }
  const rows: Array<{ originalName: string; mimeType: string; sizeBytes: number }> = [];
  for (const file of originals) {
    const sizeBytes = typeof file.size === "number" ? file.size : 0;
    if (sizeBytes <= 0 || sizeBytes > MAX_BYTES) {
      return { ok: false as const, error: "Invalid file size" };
    }
    const mimeType =
      typeof file.type === "string" && file.type.length > 0 ? file.type : "application/octet-stream";
    if (!isAllowedMime(mimeType)) {
      return { ok: false as const, error: "Unsupported media type" };
    }
    rows.push({
      originalName: typeof file.name === "string" ? file.name.slice(0, 512) : "file",
      mimeType: mimeType.slice(0, 128),
      sizeBytes
    });
  }

  return { ok: true as const, rows };
}

export async function persistMessageAttachments(
  messageId: string,
  userId: string,
  files: File[],
  parsed: { rows: Array<{ originalName: string; mimeType: string; sizeBytes: number }> }
) {
  const creates = [];
  for (let i = 0; i < parsed.rows.length; i++) {
    const meta = parsed.rows[i]!;
    const file = files[i];
    if (!file) continue;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { storageKey } = await saveUploadBuffer({
      buffer,
      mimeType: meta.mimeType,
      originalName: meta.originalName
    });
    creates.push({
      purpose: FilePurpose.MESSAGE_ATTACHMENT,
      storageKey,
      originalName: meta.originalName,
      mimeType: meta.mimeType,
      sizeBytes: meta.sizeBytes,
      uploadedByUserId: userId,
      messageId
    });
  }
  return creates;
}
