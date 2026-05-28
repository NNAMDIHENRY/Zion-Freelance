import { NextResponse } from "next/server";
import { z } from "zod";

import { resendVerificationEmail } from "@/lib/auth/email-verification";
import { prisma } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().trim().email() });

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const limited = rateLimit(`resend-verify:${ip}`, 5, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, emailVerified: true }
  });

  if (!user || user.emailVerified) {
    return NextResponse.json({ ok: true });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? new URL(req.url).origin;
  const result = await resendVerificationEmail({
    userId: user.id,
    email,
    name: user.name,
    baseUrl
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 429 });
  }

  return NextResponse.json({ ok: true });
}
