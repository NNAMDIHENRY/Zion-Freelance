import { JobStatus } from "@prisma/client";
import { createHash } from "crypto";
import { NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const ip = clientIp(req.headers);
  const rl = rateLimit(`job-view:${jobId}:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const job = await prisma.job.findFirst({
    where: { id: jobId, status: JobStatus.ACTIVE },
    select: { id: true }
  });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session = await getServerSession(authOptions);
  const viewerKey = session?.user?.id
    ? `u:${session.user.id}`
    : `ip:${createHash("sha256").update(ip).digest("hex").slice(0, 32)}`;

  const existing = await prisma.jobView.findUnique({
    where: { jobId_viewerKey: { jobId, viewerKey } }
  });
  if (!existing) {
    await prisma.$transaction([
      prisma.jobView.create({ data: { jobId, viewerKey, userId: session?.user?.id ?? null } }),
      prisma.job.update({
        where: { id: jobId },
        data: { viewCount: { increment: 1 } }
      })
    ]);
  }

  const updated = await prisma.job.findUnique({
    where: { id: jobId },
    select: { viewCount: true }
  });

  return NextResponse.json({ viewCount: updated?.viewCount ?? 0 });
}
