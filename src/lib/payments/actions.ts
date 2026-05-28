"use server";

import "server-only";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth/session";
import {
  createEscrowFundingSession,
  createWalletFundingSession,
  createWithdrawalRequest,
  fundEscrowFromWallet,
  getTransactionHistory,
  getWalletForUser,
  getWithdrawalsForUser,
  processWithdrawal,
  verifyAndSettlePayment
} from "@/lib/payments/service";
import { serializeTransaction, serializeWithdrawal } from "@/lib/payments/serialize";
import {
  escrowFundSchema,
  transactionHistorySchema,
  verifyPaymentSchema,
  walletFundSchema,
  withdrawalSchema
} from "@/lib/validators/payment";

type ActionErr = { ok: false; error: string; fieldErrors?: Record<string, string[]> };
type ActionOk<T extends object = object> = { ok: true } & T;

function flattenZod(err: import("zod").ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const i of err.errors) {
    const k = i.path.join(".") || "_";
    out[k] = out[k] ?? [];
    out[k].push(i.message);
  }
  return out;
}

async function requireUser() {
  const session = await getSession();
  if (!session?.user) return { ok: false as const, error: "Unauthorized" };
  return {
    ok: true as const,
    userId: session.user.id,
    role: session.user.role as Role
  };
}

function revalidatePaymentPaths(role: Role) {
  if (role === Role.CLIENT) revalidatePath("/client/payments");
  if (role === Role.FREELANCER) revalidatePath("/freelancer/earnings");
}

export async function createWalletFundingSessionAction(
  input: unknown
): Promise<ActionOk<{ checkoutUrl: string; txRef: string }> | ActionErr> {
  const auth = await requireUser();
  if (!auth.ok) return { ok: false, error: auth.error };

  const parsed = walletFundSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Validation failed", fieldErrors: flattenZod(parsed.error) };
  }

  const res = await createWalletFundingSession(auth.userId, parsed.data.amount);
  if (!res.ok) return { ok: false, error: res.error };

  return { ok: true, checkoutUrl: res.data.checkoutUrl, txRef: res.data.txRef };
}

export async function verifyWalletFundingAction(
  txRef: string
): Promise<ActionOk | ActionErr> {
  const auth = await requireUser();
  if (!auth.ok) return { ok: false, error: auth.error };

  const parsed = verifyPaymentSchema.safeParse({ txRef });
  if (!parsed.success) return { ok: false, error: "Invalid reference" };

  const res = await verifyAndSettlePayment(parsed.data.txRef, auth.userId);
  if (!res.ok) return { ok: false, error: res.error };

  revalidatePaymentPaths(auth.role);
  return { ok: true };
}

export async function fundEscrowAction(
  input: unknown
): Promise<ActionOk<{ checkoutUrl?: string; txRef?: string }> | ActionErr> {
  const auth = await requireUser();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (auth.role !== Role.CLIENT) return { ok: false, error: "Only clients can fund escrow" };

  const parsed = escrowFundSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Validation failed", fieldErrors: flattenZod(parsed.error) };
  }

  if (parsed.data.method === "wallet") {
    const res = await fundEscrowFromWallet(auth.userId, parsed.data.contractId, parsed.data.amount);
    if (!res.ok) return { ok: false, error: res.error };
    revalidatePath(`/dashboard/contracts/${parsed.data.contractId}`);
    revalidatePaymentPaths(auth.role);
    return { ok: true };
  }

  const res = await createEscrowFundingSession(
    auth.userId,
    parsed.data.contractId,
    parsed.data.amount
  );
  if (!res.ok) return { ok: false, error: res.error };

  return { ok: true, checkoutUrl: res.data.checkoutUrl, txRef: res.data.txRef };
}

export async function createWithdrawalRequestAction(
  input: unknown
): Promise<ActionOk<{ withdrawalId: string }> | ActionErr> {
  const auth = await requireUser();
  if (!auth.ok) return { ok: false, error: auth.error };
  if (auth.role !== Role.FREELANCER) {
    return { ok: false, error: "Only freelancers can request withdrawals" };
  }

  const parsed = withdrawalSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Validation failed", fieldErrors: flattenZod(parsed.error) };
  }

  const res = await createWithdrawalRequest(auth.userId, {
    amount: parsed.data.amount,
    payoutMethod: parsed.data.payoutMethod,
    payoutDetails: {
      accountName: parsed.data.accountName,
      accountLast4: parsed.data.accountNumber.slice(-4),
      bankCode: parsed.data.bankCode ?? "",
      bankName: parsed.data.bankName ?? ""
    }
  });
  if (!res.ok) return { ok: false, error: res.error };

  revalidatePaymentPaths(auth.role);
  return { ok: true, withdrawalId: res.data.withdrawalId };
}

export async function processWithdrawalAction(
  withdrawalId: string,
  decision: "approve" | "reject" | "complete" | "fail",
  note?: string
): Promise<ActionOk | ActionErr> {
  const auth = await requireUser();
  if (!auth.ok) return { ok: false, error: auth.error };

  const res = await processWithdrawal(auth.userId, withdrawalId, decision, note);
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true };
}

export async function getTransactionHistoryAction(filters: unknown) {
  const auth = await requireUser();
  if (!auth.ok) return { ok: false as const, error: auth.error };

  const parsed = transactionHistorySchema.safeParse(filters ?? {});
  if (!parsed.success) return { ok: false as const, error: "Invalid filters" };

  const data = await getTransactionHistory(auth.userId, parsed.data);
  return {
    ok: true as const,
    ...data,
    rows: data.rows.map(serializeTransaction)
  };
}

export async function getWalletDashboardAction() {
  const auth = await requireUser();
  if (!auth.ok) return { ok: false as const, error: auth.error };

  const { wallet, snapshot } = await getWalletForUser(auth.userId);
  const history = await getTransactionHistory(auth.userId, { page: 1, pageSize: 8 });
  const withdrawals =
    auth.role === Role.FREELANCER ? await getWithdrawalsForUser(auth.userId, 5) : [];

  return {
    ok: true as const,
    wallet: {
      id: wallet.id,
      currency: wallet.currency
    },
    snapshot,
    transactions: history.rows.map(serializeTransaction),
    withdrawals: withdrawals.map(serializeWithdrawal)
  };
}
