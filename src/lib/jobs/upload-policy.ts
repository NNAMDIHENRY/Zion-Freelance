import "server-only";

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
]);

const ALLOWED_EXT = new Set([".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".webp", ".gif"]);

export const JOB_CV_MAX_BYTES = 10 * 1024 * 1024;
export const JOB_ATTACHMENT_MAX_BYTES = 15 * 1024 * 1024;

export function sanitizeUploadFilename(name: string): string {
  const base = name.replace(/[/\\?%*:|"<>]/g, "_").trim();
  return base.slice(0, 200) || "file";
}

export function validateJobUpload(params: {
  mimeType: string;
  sizeBytes: number;
  originalName: string;
  maxBytes: number;
}): { ok: true } | { ok: false; error: string } {
  const mime = params.mimeType.toLowerCase().split(";")[0]?.trim() ?? "";
  if (!ALLOWED_MIME.has(mime)) {
    return { ok: false, error: "File type not allowed" };
  }
  const ext = params.originalName.includes(".")
    ? `.${params.originalName.split(".").pop()!.toLowerCase()}`
    : "";
  if (ext && !ALLOWED_EXT.has(ext)) {
    return { ok: false, error: "File extension not allowed" };
  }
  if (params.sizeBytes <= 0 || params.sizeBytes > params.maxBytes) {
    return { ok: false, error: "Invalid file size" };
  }
  return { ok: true };
}
