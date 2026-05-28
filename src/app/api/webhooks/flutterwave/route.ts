import { NextResponse } from "next/server";

import { processFlutterwaveWebhook } from "@/lib/payments/webhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const verifHash = request.headers.get("verif-hash");

  const result = await processFlutterwaveWebhook({ rawBody, verifHash });
  return NextResponse.json({ message: result.message }, { status: result.status });
}
