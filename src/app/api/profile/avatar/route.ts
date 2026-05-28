import { FilePurpose } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { saveUploadBuffer } from "@/lib/storage/local";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const mime = file.type || "application/octet-stream";
  if (!ALLOWED.has(mime)) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Invalid file size" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { storageKey } = await saveUploadBuffer({
    buffer,
    mimeType: mime,
    originalName: file.name
  });

  const upload = await prisma.fileUpload.create({
    data: {
      purpose: FilePurpose.AVATAR,
      storageKey,
      originalName: file.name.slice(0, 512),
      mimeType: mime,
      sizeBytes: file.size,
      uploadedByUserId: session.user.id
    },
    select: { id: true }
  });

  const previous = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { imageFileId: true }
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { imageFileId: upload.id }
  });

  if (previous?.imageFileId && previous.imageFileId !== upload.id) {
    await prisma.fileUpload.delete({ where: { id: previous.imageFileId } }).catch(() => undefined);
  }

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/profile/edit");

  return NextResponse.json(
    { ok: true, id: upload.id, url: `/api/uploads/${upload.id}` },
    { status: 201 }
  );
}
