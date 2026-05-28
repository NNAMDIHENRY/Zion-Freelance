"use server";

import { FilePurpose, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { profileUpdateSchema } from "@/lib/validators/profile";

export type ProfileActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function updateProfileAction(
  raw: unknown
): Promise<ProfileActionResult> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { ok: false, error: "Unauthorized" };
  }

  const parsed = profileUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Validation failed",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>
    };
  }

  const data = parsed.data;
  const userId = session.user.id;

  await prisma.user.update({
    where: { id: userId },
    data: { name: data.name }
  });

  if (session.user.role === Role.FREELANCER) {
    const hourly =
      data.hourlyRate !== undefined && data.hourlyRate !== ""
        ? Number(data.hourlyRate)
        : null;

    if (hourly !== null && (Number.isNaN(hourly) || hourly < 0)) {
      return { ok: false, error: "Invalid hourly rate" };
    }

    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId },
      select: { id: true }
    });
    if (!profile) {
      return { ok: false, error: "Freelancer profile not found" };
    }

    await prisma.freelancerProfile.update({
      where: { userId },
      data: {
        headline: data.headline || null,
        bio: data.bio || null,
        hourlyRate: hourly,
        availability: data.availability ?? undefined,
        categorySlugs: data.categorySlugs ?? undefined,
        isPublic: data.isPublic ?? undefined
      }
    });

    if (data.skillIds) {
      await prisma.freelancerSkill.deleteMany({ where: { freelancerProfileId: profile.id } });
      if (data.skillIds.length) {
        await prisma.freelancerSkill.createMany({
          data: data.skillIds.map((skillId) => ({
            freelancerProfileId: profile.id,
            skillId
          })),
          skipDuplicates: true
        });
      }
    }
  }

  if (session.user.role === Role.CLIENT) {
    await prisma.clientProfile.update({
      where: { userId },
      data: {
        companyName: data.companyName || null,
        websiteUrl: data.websiteUrl || null
      }
    });
  }

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/profile/edit");
  revalidatePath(`/users/${userId}`);

  return { ok: true };
}

export async function uploadPortfolioFileAction(formData: FormData): Promise<
  | { ok: true; id: string }
  | { ok: false; error: string }
> {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== Role.FREELANCER) {
    return { ok: false, error: "Unauthorized" };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "No file provided" };
  }

  const maxBytes = 10 * 1024 * 1024;
  if (file.size <= 0 || file.size > maxBytes) {
    return { ok: false, error: "Invalid file size" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { saveUploadBuffer } = await import("@/lib/storage/local");

  const { storageKey } = await saveUploadBuffer({
    buffer,
    mimeType: file.type || "application/octet-stream",
    originalName: file.name
  });

  const row = await prisma.fileUpload.create({
    data: {
      purpose: FilePurpose.PORTFOLIO,
      storageKey,
      originalName: file.name.slice(0, 512),
      mimeType: file.type.slice(0, 128) || "application/octet-stream",
      sizeBytes: file.size,
      uploadedByUserId: session.user.id
    },
    select: { id: true }
  });

  revalidatePath("/dashboard/profile");
  revalidatePath(`/users/${session.user.id}`);

  return { ok: true, id: row.id };
}
