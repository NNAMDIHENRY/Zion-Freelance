import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { syncMarketplaceTaxonomy } from "@/lib/marketplace/taxonomy";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validators/auth";

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const limited = rateLimit(`register:${ip}`, 5, 15 * 60 * 1000);
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

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: flat.fieldErrors },
      { status: 422 }
    );
  }

  const {
    name,
    email,
    password,
    role,
    categorySlugs,
    skillIds,
    country,
    phone,
    city,
    referralSource,
    receiveEmailUpdates,
    acceptedTerms
  } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const hashed = await hashPassword(password);

  if (role === Role.FREELANCER) {
    await syncMarketplaceTaxonomy();
  }

  let createdUserId = "";

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashed,
        role,
        receiveEmailUpdates: receiveEmailUpdates ?? true,
        termsAcceptedAt: acceptedTerms ? new Date() : null
      }
    });
    createdUserId = user.id;

    await tx.userRegistrationContact.create({
      data: {
        userId: user.id,
        email: normalizedEmail,
        phone,
        country,
        city,
        referralSource
      }
    });

    if (role === Role.CLIENT) {
      await tx.clientProfile.create({ data: { userId: user.id } });
    } else if (role === Role.FREELANCER) {
      const profile = await tx.freelancerProfile.create({
        data: {
          userId: user.id,
          categorySlugs: categorySlugs ?? []
        }
      });
      if (skillIds?.length) {
        await tx.freelancerSkill.createMany({
          data: skillIds.map((skillId) => ({
            freelancerProfileId: profile.id,
            skillId
          })),
          skipDuplicates: true
        });
      }
    }
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? new URL(req.url).origin;
  const { createAndSendVerificationEmail } = await import("@/lib/auth/email-verification");
  await createAndSendVerificationEmail({
    userId: createdUserId,
    email: normalizedEmail,
    name,
    baseUrl
  }).catch(() => undefined);

  return NextResponse.json(
    { ok: true, message: "Account created. Check your email to verify before signing in." },
    { status: 201 }
  );
}
