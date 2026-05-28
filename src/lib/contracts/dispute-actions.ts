"use server";

import { revalidatePath } from "next/cache";

import { openContractDispute } from "@/lib/contracts/disputes";
import { getSession } from "@/lib/auth/session";

export async function openDisputeAction(contractId: string, reason: string) {
  const session = await getSession();
  if (!session?.user) return { ok: false as const, error: "Unauthorized" };

  const res = await openContractDispute(
    session.user.id,
    session.user.role,
    contractId,
    reason
  );
  if (!res.ok) return { ok: false as const, error: res.error };

  revalidatePath(`/dashboard/contracts/${contractId}`);
  return { ok: true as const };
}
