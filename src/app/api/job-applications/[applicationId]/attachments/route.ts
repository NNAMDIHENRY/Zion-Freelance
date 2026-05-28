import { NextResponse } from "next/server";

import { insertJobApplicationFile } from "@/lib/jobs/attachment-write";
import { requireSessionUser } from "@/lib/jobs/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  const auth = await requireSessionUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const rl = rateLimit(`job-app-upload:${auth.userId}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many uploads" }, { status: 429 });
  }

  const { applicationId } = await params;
  const form = await req.formData();
  const file = form.get("file");
  const purpose = form.get("purpose");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const filePurpose =
    purpose === "cv" ? "JOB_APPLICATION_CV" : "JOB_APPLICATION_ATTACHMENT";

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await insertJobApplicationFile({
    applicationId,
    applicantId: auth.userId,
    userId: auth.userId,
    purpose: filePurpose,
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
