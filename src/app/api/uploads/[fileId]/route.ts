import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { readUploadBuffer } from "@/lib/storage/local";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId } = await params;

  const file = await prisma.fileUpload.findUnique({
    where: { id: fileId },
    select: {
      storageKey: true,
      mimeType: true,
      originalName: true,
      purpose: true,
      uploadedByUserId: true,
      project: { select: { client: { select: { userId: true } } } },
      proposal: {
        select: {
          freelancer: { select: { userId: true } },
          project: { select: { client: { select: { userId: true } } } }
        }
      },
      message: {
        select: {
          conversation: {
            select: { participants: { select: { userId: true } } }
          }
        }
      },
      job: { select: { posterId: true } },
      jobApplication: {
        select: {
          applicantId: true,
          job: { select: { posterId: true } }
        }
      },
      userAvatar: { select: { id: true } }
    }
  });

  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  const viewerId = session?.user?.id;

  const isAvatar = Boolean(file.userAvatar);
  const isPublicPortfolio = file.purpose === "PORTFOLIO";
  const isMarketingImage = file.purpose === "MARKETING_IMAGE";

  let allowed = isAvatar || isPublicPortfolio || isMarketingImage;

  if (!allowed && viewerId) {
    if (file.uploadedByUserId === viewerId) allowed = true;
    if (file.project?.client.userId === viewerId) allowed = true;
    if (file.proposal?.freelancer.userId === viewerId) allowed = true;
    if (file.proposal?.project.client.userId === viewerId) allowed = true;
    if (file.message?.conversation.participants.some((p) => p.userId === viewerId)) {
      allowed = true;
    }
    if (file.job?.posterId === viewerId) allowed = true;
    if (file.jobApplication?.applicantId === viewerId) allowed = true;
    if (file.jobApplication?.job.posterId === viewerId) allowed = true;
  }

  if (!allowed && file.purpose === "PROJECT_BRIEF") {
    allowed = true;
  }

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const buffer = await readUploadBuffer(file.storageKey);
    const cacheControl = isMarketingImage || isPublicPortfolio || isAvatar
      ? "public, max-age=86400, stale-while-revalidate=3600"
      : "private, max-age=3600";
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(file.originalName)}"`,
        "Cache-Control": cacheControl
      }
    });
  } catch {
    return NextResponse.json({ error: "File missing on disk" }, { status: 404 });
  }
}
