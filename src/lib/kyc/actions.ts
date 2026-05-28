"use server";

import "server-only";

import { KycStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireSession } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";

const kycSubmitSchema = z.object({
  whatsappNumber: z.string().trim().min(8).max(30),
  documentType: z.string().trim().min(2).max(64),
  documentNumber: z.string().trim().min(3).max(64)
});

type Result =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function submitKycAction(raw: unknown): Promise<Result> {
  const session = await requireSession();
  const parsed = kycSubmitSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const i of parsed.error.errors) {
      const k = i.path.join(".") || "_";
      fieldErrors[k] = fieldErrors[k] ?? [];
      fieldErrors[k].push(i.message);
    }
    return { ok: false, error: "Validation failed", fieldErrors };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { verifiedAt: true }
  });
  if (dbUser?.verifiedAt) {
    return { ok: false, error: "Your account is already verified." };
  }

  const existing = await prisma.kycSubmission.findUnique({
    where: { userId: session.user.id }
  });
  if (existing?.status === KycStatus.PENDING || existing?.status === KycStatus.VERIFIED) {
    return { ok: false, error: "A verification request is already on file." };
  }

  await prisma.kycSubmission.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      status: KycStatus.PENDING,
      whatsappNumber: parsed.data.whatsappNumber,
      documentType: parsed.data.documentType,
      documentNumber: parsed.data.documentNumber,
      submittedAt: new Date()
    },
    update: {
      status: KycStatus.PENDING,
      whatsappNumber: parsed.data.whatsappNumber,
      documentType: parsed.data.documentType,
      documentNumber: parsed.data.documentNumber,
      declineReason: null,
      submittedAt: new Date()
    }
  });

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/settings");
  return { ok: true };
}
