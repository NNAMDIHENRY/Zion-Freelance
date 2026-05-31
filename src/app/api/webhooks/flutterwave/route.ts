import { NextResponse } from "next/server";
import { verifyAndSettlePayment } from "@/lib/payments/service";
import { verifyWebhookSignature } from "@/lib/payments/flutterwave/client";

export async function POST(req: Request) {
  const signature = req.headers.get("verif-hash"); // Flutterwave header

  if (!verifyWebhookSignature(signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = await req.json();

  const txRef = body?.data?.tx_ref;

  if (!txRef) {
    return NextResponse.json({ error: "Missing tx_ref" }, { status: 400 });
  }

  try {
    // 🔥 THIS IS THE ONLY PLACE PAYMENT IS CONFIRMED
    await verifyAndSettlePayment(txRef);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Webhook error:", e);

    return NextResponse.json(
      { error: "Settlement failed" },
      { status: 500 }
    );
  }
}