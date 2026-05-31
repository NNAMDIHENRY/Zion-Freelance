import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const txRef = url.searchParams.get("tx_ref");

  if (!txRef) {
    return NextResponse.json(
      { error: "Missing tx_ref" },
      { status: 400 }
    );
  }

  return NextResponse.redirect(
    new URL(
      `/client/payments/pending?tx_ref=${encodeURIComponent(txRef)}`,
      request.url
    )
  );
}