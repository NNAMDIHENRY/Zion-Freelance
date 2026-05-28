"use server";

import { FilePurpose } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { saveUploadBuffer } from "@/lib/storage/local";
import { portfolioItemSchema } from "@/lib/validators/portfolio";

export type PortfolioActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

async function requireFreelancerProfile() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "FREELANCER") {
    return { ok: false as const, error: "Unauthorized" };
  }
  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true }
  });
  if (!profile) return { ok: false as const, error: "Freelancer profile not found" };
  return { ok: true as const, userId: session.user.id, profileId: profile.id };
}

export async function createPortfolioItemAction(
  raw: unknown,
  formData?: FormData
): Promise<PortfolioActionResult> {
  const auth = await requireFreelancerProfile();
  if (!auth.ok) return auth;

  const parsed = portfolioItemSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>
    };
  }

  const count = await prisma.portfolioItem.count({
    where: { freelancerProfileId: auth.profileId }
  });
  if (count >= 24) return { ok: false, error: "Portfolio limit reached (24 items)" };

  let imageFileId: string | null = null;
  const file = formData?.get("image");
  if (file instanceof File && file.size > 0) {
    if (file.size > 10 * 1024 * 1024) return { ok: false, error: "Image must be under 10MB" };
    const buffer = Buffer.from(await file.arrayBuffer());
    const { storageKey } = await saveUploadBuffer({
      buffer,
      mimeType: file.type || "image/jpeg",
      originalName: file.name
    });
    const upload = await prisma.fileUpload.create({
      data: {
        purpose: FilePurpose.PORTFOLIO,
        storageKey,
        originalName: file.name.slice(0, 512),
        mimeType: file.type.slice(0, 128) || "image/jpeg",
        sizeBytes: file.size,
        uploadedByUserId: auth.userId
      },
      select: { id: true }
    });
    imageFileId = upload.id;
  }

  const item = await prisma.portfolioItem.create({
    data: {
      freelancerProfileId: auth.profileId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      projectUrl: parsed.data.projectUrl || null,
      imageFileId,
      sortOrder: count
    },
    select: { id: true }
  });

  revalidatePath("/dashboard/profile");
  revalidatePath(`/users/${auth.userId}`);
  return { ok: true, id: item.id };
}

export async function updatePortfolioItemAction(
  itemId: string,
  raw: unknown,
  formData?: FormData
): Promise<PortfolioActionResult> {
  const auth = await requireFreelancerProfile();
  if (!auth.ok) return auth;

  const parsed = portfolioItemSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>
    };
  }

  const existing = await prisma.portfolioItem.findFirst({
    where: { id: itemId, freelancerProfileId: auth.profileId }
  });
  if (!existing) return { ok: false, error: "Portfolio item not found" };

  let imageFileId = existing.imageFileId;
  const file = formData?.get("image");
  if (file instanceof File && file.size > 0) {
    if (file.size > 10 * 1024 * 1024) return { ok: false, error: "Image must be under 10MB" };
    const buffer = Buffer.from(await file.arrayBuffer());
    const { storageKey } = await saveUploadBuffer({
      buffer,
      mimeType: file.type || "image/jpeg",
      originalName: file.name
    });
    const upload = await prisma.fileUpload.create({
      data: {
        purpose: FilePurpose.PORTFOLIO,
        storageKey,
        originalName: file.name.slice(0, 512),
        mimeType: file.type.slice(0, 128) || "image/jpeg",
        sizeBytes: file.size,
        uploadedByUserId: auth.userId
      },
      select: { id: true }
    });
    imageFileId = upload.id;
  }

  await prisma.portfolioItem.update({
    where: { id: itemId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      projectUrl: parsed.data.projectUrl || null,
      imageFileId
    }
  });

  revalidatePath("/dashboard/profile");
  revalidatePath(`/users/${auth.userId}`);
  return { ok: true, id: itemId };
}

export async function deletePortfolioItemAction(itemId: string): Promise<PortfolioActionResult> {
  const auth = await requireFreelancerProfile();
  if (!auth.ok) return auth;

  const existing = await prisma.portfolioItem.findFirst({
    where: { id: itemId, freelancerProfileId: auth.profileId }
  });
  if (!existing) return { ok: false, error: "Portfolio item not found" };

  await prisma.portfolioItem.delete({ where: { id: itemId } });
  revalidatePath("/dashboard/profile");
  revalidatePath(`/users/${auth.userId}`);
  return { ok: true };
}
