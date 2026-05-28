import "server-only";

import crypto from "crypto";

import { prisma } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 2 * 60 * 1000;

function hashToken(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function createAndSendVerificationEmail(params: {
  userId: string;
  email: string;
  name: string;
  baseUrl: string;
}) {
  await prisma.emailVerificationToken.updateMany({
    where: { userId: params.userId, usedAt: null },
    data: { usedAt: new Date() }
  });

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.emailVerificationToken.create({
    data: {
      userId: params.userId,
      tokenHash,
      expiresAt
    }
  });

  const verifyUrl = `${params.baseUrl.replace(/\/$/, "")}/auth/verify-email?token=${encodeURIComponent(rawToken)}`;
  await sendVerificationEmail({
    to: params.email,
    name: params.name,
    verifyUrl
  });
}

export async function verifyEmailToken(rawToken: string) {
  const tokenHash = hashToken(rawToken.trim());
  const row = await prisma.emailVerificationToken.findFirst({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    select: { id: true, userId: true }
  });
  if (!row) return { ok: false as const, error: "Invalid or expired link" };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { emailVerified: new Date() }
    }),
    prisma.emailVerificationToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() }
    }),
    prisma.emailVerificationToken.updateMany({
      where: { userId: row.userId, usedAt: null },
      data: { usedAt: new Date() }
    })
  ]);

  return { ok: true as const, userId: row.userId };
}

export async function resendVerificationEmail(params: {
  userId: string;
  email: string;
  name: string;
  baseUrl: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { emailVerified: true }
  });
  if (!user) return { ok: false as const, error: "User not found" };
  if (user.emailVerified) return { ok: false as const, error: "Already verified" };

  const recent = await prisma.emailVerificationToken.findFirst({
    where: {
      userId: params.userId,
      usedAt: null,
      createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) }
    },
    orderBy: { createdAt: "desc" }
  });
  if (recent) return { ok: false as const, error: "Please wait before requesting another email" };

  await createAndSendVerificationEmail(params);
  return { ok: true as const };
}
