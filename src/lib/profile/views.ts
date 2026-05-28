import "server-only";
import crypto from "crypto";
import { prisma } from "@/lib/db";

const VIEW_COOLDOWN_MS = 30 * 60 * 1000;

export async function recordProfileView(params: {
  viewedUserId: string;
  viewerUserId?: string | null;
  ip: string;
  userAgent: string;
}) {
  const ip = params.ip ?? "anon";
  const ua = params.userAgent ?? "";

  const viewerHash = crypto
    .createHash("sha256")
    .update(`${ip}:${ua}:${params.viewedUserId}`)
    .digest("hex");

  if (params.viewerUserId === params.viewedUserId) return;

  const since = new Date(Date.now() - VIEW_COOLDOWN_MS);

  const recent = await prisma.profileView.findFirst({
    where: {
      viewedUserId: params.viewedUserId,
      createdAt: { gt: since },
      OR: [
        params.viewerUserId ? { viewerUserId: params.viewerUserId } : undefined,
        { viewerHash }
      ].filter(Boolean) as Array<
        { viewerUserId: string } | { viewerHash: string }
      >
    }
  });

  if (recent) return;

  await prisma.$transaction(async (tx) => {
    await tx.profileView.create({
      data: {
        viewedUserId: params.viewedUserId,
        viewerUserId: params.viewerUserId ?? null,
        viewerHash: params.viewerUserId ? null : viewerHash
      }
    });

    const freelancer = await tx.freelancerProfile.findUnique({
      where: { userId: params.viewedUserId },
      select: { id: true }
    });

    if (freelancer) {
      await tx.freelancerProfile.update({
        where: { id: freelancer.id },
        data: { profileViewCount: { increment: 1 } }
      });
      return;
    }

    const client = await tx.clientProfile.findUnique({
      where: { userId: params.viewedUserId },
      select: { id: true }
    });

    if (client) {
      await tx.clientProfile.update({
        where: { id: client.id },
        data: { profileViewCount: { increment: 1 } }
      });
    }
  });
}