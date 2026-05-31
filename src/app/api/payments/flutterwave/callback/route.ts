import { NextResponse } from "next/server";
import { verifyAndSettlePayment } from "@/lib/payments/service";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const txRef = url.searchParams.get("tx_ref");

  if (!txRef) {
    return NextResponse.redirect(
      new URL("/client/payments?payment=error&missing=tx_ref", request.url)
    );
  }

  try {
    await verifyAndSettlePayment(txRef);
  } catch (e) {
    return NextResponse.redirect(
      new URL("/client/payments?payment=failed", request.url)
    );
  }

  return NextResponse.redirect(
    new URL("/client/payments?payment=success", request.url)
  );
}