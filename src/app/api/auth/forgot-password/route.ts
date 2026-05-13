import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import {
  createOpaqueToken,
  hashOpaqueToken
} from "@/lib/auth/token";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { forgotPasswordSchema } from "@/lib/validators/auth";
import { assertAuthEnv } from "@/lib/env/server";

const RESET_TTL_MS = 60 * 60 * 1000;

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const limited = rateLimit(`forgot:${ip}`, 8, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: flat.fieldErrors },
      { status: 422 }
    );
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  // Uniform response to reduce email enumeration.
  const generic = NextResponse.json({
    ok: true,
    message: "If an account exists for that email, we sent reset instructions."
  });

  if (!user) {
    return generic;
  }

  const rawToken = createOpaqueToken();
  const tokenHash = hashOpaqueToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);

  await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null }
    });
    await tx.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt }
    });
  });

  const { url } = assertAuthEnv();
  const resetUrl = `${url.replace(/\/$/, "")}/auth/reset-password?token=${encodeURIComponent(rawToken)}`;

  try {
    await sendPasswordResetEmail({
      to: user.email,
      resetUrl,
      name: user.name
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Password reset email failed", err);
    return NextResponse.json(
      { error: "Could not send email right now. Try again later." },
      { status: 503 }
    );
  }

  return generic;
}
