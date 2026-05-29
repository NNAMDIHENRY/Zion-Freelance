import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { verifyAndSettlePayment } from "@/lib/payments/service";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const txRef = url.searchParams.get("tx_ref");
  const contractId = url.searchParams.get("contractId");
  const status = url.searchParams.get("status");

  const baseUrl =
    process.env.NEXTAUTH_URL || process.env.APP_URL || "";

  if (!txRef) {
    return NextResponse.redirect(
      `${baseUrl}/client/payments?payment=error&message=missing_reference`
    );
  }

  let userId: string | undefined;

  try {
    const session = await getSession();
    userId = session?.user?.id;
  } catch (e) {
    userId = undefined;
  }

  let result;

  try {
    result = await verifyAndSettlePayment(txRef, userId);
  } catch (e) {
    return NextResponse.redirect(
      `${baseUrl}/client/payments?payment=failed&message=verification_error`
    );
  }

  if (!result.ok) {
    const role = (await getSession())?.user?.role;

    const base =
      role === "FREELANCER"
        ? "/freelancer/earnings"
        : "/client/payments";

    return NextResponse.redirect(
      `${baseUrl}${base}?payment=failed&message=${encodeURIComponent(
        result.error
      )}`
    );
  }

  const cid = contractId || result.data.contractId;

  if (cid) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard/contracts/${cid}?payment=success&tx_ref=${encodeURIComponent(
        txRef
      )}`
    );
  }

  const role = (await getSession())?.user?.role;

  const base =
    role === "FREELANCER"
      ? "/freelancer/earnings"
      : "/client/payments";

  return NextResponse.redirect(
    `${baseUrl}${base}?payment=success&tx_ref=${encodeURIComponent(
      txRef
    )}&status=${status ?? "ok"}`
  );
}