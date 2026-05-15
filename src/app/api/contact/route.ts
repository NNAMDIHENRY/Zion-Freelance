import { NextResponse } from "next/server";
import { z } from "zod";

import { clientIp, rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320),
  company: z.string().trim().max(160).optional(),
  topic: z.string().trim().max(160).optional(),
  message: z.string().trim().min(1).max(8000)
});

export async function POST(request: Request) {
  const ip = clientIp(request.headers);
  const limited = rateLimit(`contact:${ip}`, 8, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your inputs and try again." }, { status: 400 });
  }

  // In production, forward to CRM, email provider, or ticketing system.
  console.info("[contact]", parsed.data);

  return NextResponse.json({ ok: true });
}
