import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { verifyAndSettlePayment } from "@/lib/payments/service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const txRef = searchParams.get("tx_ref");
  const contractId = searchParams.get("contractId");
  const status = searchParams.get("status");

  if (!txRef) {
    redirect("/client/payments?payment=error&message=missing_reference");
  }

  const session = await getSession();
  const userId = session?.user?.id;

  const result = await verifyAndSettlePayment(txRef, userId);
  if (!result.ok) {
    const role = session?.user?.role;
    const base = role === "FREELANCER" ? "/freelancer/earnings" : "/client/payments";
    redirect(`${base}?payment=failed&message=${encodeURIComponent(result.error)}`);
  }

  if (contractId || result.data.contractId) {
    const cid = contractId ?? result.data.contractId;
    redirect(`/dashboard/contracts/${cid}?payment=success&tx_ref=${encodeURIComponent(txRef)}`);
  }

  const base =
    session?.user?.role === "FREELANCER" ? "/freelancer/earnings" : "/client/payments";
  redirect(`${base}?payment=success&tx_ref=${encodeURIComponent(txRef)}&status=${status ?? "ok"}`);
}
