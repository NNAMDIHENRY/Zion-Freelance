import "server-only";

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_ROOT = process.env.UPLOAD_DIR ?? path.join(process.cwd(), ".uploads");

export function uploadPathForKey(storageKey: string) {
  return path.join(UPLOAD_ROOT, storageKey);
}

export async function ensureUploadDir() {
  await mkdir(UPLOAD_ROOT, { recursive: true });
}

export async function saveUploadBuffer(params: {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
}): Promise<{ storageKey: string }> {
  await ensureUploadDir();
  const ext = path.extname(params.originalName) || "";
  const storageKey = `${randomUUID()}${ext}`;
  await writeFile(uploadPathForKey(storageKey), params.buffer);
  return { storageKey };
}

export async function readUploadBuffer(storageKey: string): Promise<Buffer> {
  return readFile(uploadPathForKey(storageKey));
}
