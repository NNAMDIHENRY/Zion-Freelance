import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import { insertJobAttachment } from "@/lib/jobs/attachment-write";
import { requireVerifiedPoster } from "@/lib/jobs/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const auth = await requireVerifiedPoster();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { jobId } = await params;
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await insertJobAttachment({
    jobId,
    posterId: auth.userId,
    userId: auth.userId,
    originalName: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: buffer.length,
    buffer
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ id: result.id });
}
