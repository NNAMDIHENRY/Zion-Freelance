import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const txRef = url.searchParams.get("tx_ref");
  const contractId = url.searchParams.get("contractId");

  const baseUrl =
    process.env.NEXTAUTH_URL || process.env.APP_URL || "";

  if (!txRef) {
    return NextResponse.redirect(
      `${baseUrl}/client/payments?payment=error&reason=missing_reference`
    );
  }

  // ❗ DO NOT VERIFY PAYMENT HERE
  // ❗ DO NOT CALL DATABASE HERE
  // ❗ DO NOT USE SESSION

  return NextResponse.redirect(
    `${baseUrl}/client/payments/pending?tx_ref=${encodeURIComponent(txRef)}${
      contractId ? `&contractId=${contractId}` : ""
    }`
  );
}