import { FilePurpose, Role } from "@prisma/client";
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
  if (!session?.user?.id || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    return NextResponse.json(
      { error: "Unsupported image type. Use JPEG, PNG, WebP, or GIF." },
      { status: 400 }
    );
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File must be between 1 byte and 5 MB." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { storageKey } = await saveUploadBuffer({
    buffer,
    mimeType: mime,
    originalName: file.name
  });

  const upload = await prisma.fileUpload.create({
    data: {
      purpose: FilePurpose.MARKETING_IMAGE,
      storageKey,
      originalName: file.name.slice(0, 512),
      mimeType: mime,
      sizeBytes: file.size,
      uploadedByUserId: session.user.id
    },
    select: { id: true }
  });

  revalidatePath("/");
  revalidatePath("/admin/marketing");

  return NextResponse.json(
    { ok: true, id: upload.id, url: `/api/uploads/${upload.id}` },
    { status: 201 }
  );
}
