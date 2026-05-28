import "server-only";

import {
  Prisma,
  TransactionStatus,
  TransactionType,
  type Wallet
} from "@prisma/client";

import { prisma } from "@/lib/db";
import { generateIdempotencyKey, generateLedgerReference } from "@/lib/payments/references";
import type { PaymentServiceResult } from "@/lib/payments/types";
import { getWalletBalanceSnapshot, snapshotFromWallet } from "@/lib/payments/wallet/balance";

function fail<T>(
  error: string,
  code: "NOT_FOUND" | "FORBIDDEN" | "BAD_STATE" | "CONFLICT" = "BAD_STATE"
): PaymentServiceResult<T> {
  return { ok: false, error, code };
}

export async function ensureWalletForUser(userId: string, currency = "USD"): Promise<Wallet> {
  const existing = await prisma.wallet.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.wallet.create({
    data: { userId, currency }
  });
}

export async function getWalletForUser(userId: string) {
  const wallet = await ensureWalletForUser(userId);
  const snapshot = await getWalletBalanceSnapshot(wallet.id);
  return { wallet, snapshot: snapshot! };
}

type TxClient = Prisma.TransactionClient;

export async function creditWalletAvailable(
  tx: TxClient,
  params: {
    walletId: string;
    amount: number;
    type: TransactionType;
    description: string;
    source: string;
    paymentId?: string;
    idempotencyKey: string;
    metadata?: Prisma.InputJsonValue;
  }
) {
  const wallet = await tx.wallet.findUnique({ where: { id: params.walletId } });
  if (!wallet) throw new Error("Wallet not found");

  const existing = await tx.transaction.findUnique({
    where: { idempotencyKey: params.idempotencyKey }
  });
  if (existing) return existing;

  const newBalance = Number(wallet.balance.toString()) + params.amount;
  const pending = Math.max(0, Number(wallet.pendingBalance.toString()) - params.amount);

  await tx.wallet.update({
    where: { id: params.walletId },
    data: {
      balance: newBalance,
      pendingBalance: pending
    }
  });

  return tx.transaction.create({
    data: {
      reference: generateLedgerReference("credit"),
      type: params.type,
      status: TransactionStatus.COMPLETED,
      amount: params.amount,
      currency: wallet.currency,
      description: params.description,
      source: params.source,
      metadata: params.metadata,
      idempotencyKey: params.idempotencyKey,
      balanceAfter: newBalance,
      walletId: params.walletId,
      paymentId: params.paymentId
    }
  });
}

export async function debitWalletAvailable(
  tx: TxClient,
  params: {
    walletId: string;
    amount: number;
    type: TransactionType;
    description: string;
    source: string;
    idempotencyKey: string;
    metadata?: Prisma.InputJsonValue;
  }
): Promise<PaymentServiceResult<{ transactionId: string }>> {
  const wallet = await tx.wallet.findUnique({ where: { id: params.walletId } });
  if (!wallet) return fail("Wallet not found", "NOT_FOUND");

  const existing = await tx.transaction.findUnique({
    where: { idempotencyKey: params.idempotencyKey }
  });
  if (existing) return { ok: true, data: { transactionId: existing.id } };

  const available = Number(wallet.balance.toString());
  if (available + 0.0001 < params.amount) {
    return fail("Insufficient available balance", "BAD_STATE");
  }

  const newBalance = available - params.amount;
  await tx.wallet.update({
    where: { id: params.walletId },
    data: { balance: newBalance }
  });

  const row = await tx.transaction.create({
    data: {
      reference: generateLedgerReference("debit"),
      type: params.type,
      status: TransactionStatus.COMPLETED,
      amount: params.amount,
      currency: wallet.currency,
      description: params.description,
      source: params.source,
      metadata: params.metadata,
      idempotencyKey: params.idempotencyKey,
      balanceAfter: newBalance,
      walletId: params.walletId
    }
  });

  return { ok: true, data: { transactionId: row.id } };
}

export async function lockWalletForEscrow(
  tx: TxClient,
  params: {
    walletId: string;
    amount: number;
    description: string;
    idempotencyKey: string;
    escrowRecordId?: string;
    paymentId?: string;
  }
): Promise<PaymentServiceResult<{ transactionId: string }>> {
  const debit = await debitWalletAvailable(tx, {
    walletId: params.walletId,
    amount: params.amount,
    type: TransactionType.ESCROW_HOLD,
    description: params.description,
    source: "wallet",
    idempotencyKey: params.idempotencyKey,
    metadata: { escrowRecordId: params.escrowRecordId }
  });
  if (!debit.ok) return debit;

  const wallet = await tx.wallet.findUnique({ where: { id: params.walletId } });
  if (!wallet) return fail("Wallet not found", "NOT_FOUND");

  const locked = Number(wallet.lockedBalance.toString()) + params.amount;
  await tx.wallet.update({
    where: { id: params.walletId },
    data: { lockedBalance: locked }
  });

  if (params.escrowRecordId) {
    await tx.transaction.update({
      where: { id: debit.data.transactionId },
      data: { escrowRecordId: params.escrowRecordId }
    });
  }

  return debit;
}

export async function releaseEscrowToPayee(
  tx: TxClient,
  params: {
    payerWalletId: string;
    payeeWalletId: string;
    amount: number;
    description: string;
    idempotencyKey: string;
    escrowRecordId: string;
  }
) {
  const existing = await tx.transaction.findUnique({
    where: { idempotencyKey: params.idempotencyKey }
  });
  if (existing) return;

  const payer = await tx.wallet.findUnique({ where: { id: params.payerWalletId } });
  const payee = await tx.wallet.findUnique({ where: { id: params.payeeWalletId } });
  if (!payer || !payee) throw new Error("Wallet not found");

  const payerLocked = Number(payer.lockedBalance.toString());
  const releaseAmt = params.amount;
  if (payerLocked + 0.0001 < releaseAmt) {
    throw new Error("Insufficient locked escrow balance");
  }

  await tx.wallet.update({
    where: { id: params.payerWalletId },
    data: { lockedBalance: payerLocked - releaseAmt }
  });

  const payeeBal = Number(payee.balance.toString()) + releaseAmt;
  await tx.wallet.update({
    where: { id: params.payeeWalletId },
    data: { balance: payeeBal }
  });

  await tx.transaction.create({
    data: {
      reference: generateLedgerReference("escrow_release"),
      type: TransactionType.ESCROW_RELEASE,
      status: TransactionStatus.COMPLETED,
      amount: releaseAmt,
      currency: payee.currency,
      description: params.description,
      source: "escrow",
      idempotencyKey: params.idempotencyKey,
      balanceAfter: payeeBal,
      walletId: params.payeeWalletId,
      escrowRecordId: params.escrowRecordId
    }
  });
}

export async function addPendingDeposit(walletId: string, amount: number) {
  const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
  if (!wallet) return;
  const pending = Number(wallet.pendingBalance.toString()) + amount;
  await prisma.wallet.update({
    where: { id: walletId },
    data: { pendingBalance: pending }
  });
}

export async function reserveWithdrawal(
  tx: TxClient,
  params: {
    walletId: string;
    amount: number;
    withdrawalRequestId: string;
    idempotencyKey: string;
  }
): Promise<PaymentServiceResult<{ transactionId: string }>> {
  return debitWalletAvailable(tx, {
    walletId: params.walletId,
    amount: params.amount,
    type: TransactionType.WITHDRAWAL,
    description: "Withdrawal request reserved",
    source: "withdrawal",
    idempotencyKey: params.idempotencyKey,
    metadata: { withdrawalRequestId: params.withdrawalRequestId }
  });
}

export { snapshotFromWallet, getWalletBalanceSnapshot };
