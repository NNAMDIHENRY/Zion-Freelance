import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyEmailToken } from "@/lib/auth/email-verification";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({ token: z.string().min(1) });

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const limited = rateLimit(`verify-email:${ip}`, 20, 15 * 60 * 1000);
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
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const result = await verifyEmailToken(parsed.data.token);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
