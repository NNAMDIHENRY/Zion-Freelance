import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);

  return NextResponse.json({
    success: true,
    txRef: url.searchParams.get("tx_ref"),
    status: url.searchParams.get("status"),
    plan: url.searchParams.get("plan")
  });
}