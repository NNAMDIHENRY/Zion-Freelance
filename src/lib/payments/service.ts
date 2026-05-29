import "server-only";

import {
  ContractStatus,
  PaymentAttemptPurpose,
  PaymentAttemptStatus,
  PaymentProvider,
  PaymentStatus,
  Prisma,
  Role,
  TransactionStatus,
  TransactionType,
  WithdrawalStatus
} from "@prisma/client";

import { prisma } from "@/lib/db";
import { isFlutterwaveConfigured, paymentEnv } from "@/lib/env/payments";
import { PAYMENT_CALLBACK_PATH, PAYMENT_LIMITS } from "@/lib/payments/constants";
import {
  applyEscrowFundingInTransaction,
  computeEscrowFundAmount
} from "@/lib/payments/escrow-funding";
import {
  initializeFlutterwavePayment,
  verifyFlutterwaveTransaction
} from "@/lib/payments/flutterwave/client";
import {
  generateIdempotencyKey,
  generateLedgerReference,
  generateTxRef
} from "@/lib/payments/references";
import type {
  CheckoutSession,
  PaymentServiceResult,
  TransactionHistoryFilters
} from "@/lib/payments/types";
import { validateVerifiedCharge } from "@/lib/payments/verify";
import { getWalletBalanceSnapshot } from "@/lib/payments/wallet/balance";
import {
  addPendingDeposit,
  creditWalletAvailable,
  ensureWalletForUser,
  getWalletForUser,
  lockWalletForEscrow,
  reserveWithdrawal
} from "@/lib/payments/wallet/service";
import { createPaymentNotification } from "@/lib/payments/notifications";

type ErrCode = "UNAUTHORIZED" | "NOT_FOUND" | "FORBIDDEN" | "CONFLICT" | "BAD_STATE" | "VALIDATION" | "PROVIDER_ERROR";

function fail<T>(error: string, code: ErrCode = "BAD_STATE"): PaymentServiceResult<T> {
  return { ok: false, error, code };
}

async function getUserEmail(userId: string) {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
  if (!u) throw new Error("User not found");
  return u;
}

type ClientContractRow = Prisma.ContractGetPayload<{
  include: {
    project: { select: { client: { select: { userId: true } } } };
    escrow: true;
  };
}>;

async function assertClientOwnsContract(
  userId: string,
  contractId: string
): Promise<PaymentServiceResult<{ contract: ClientContractRow }>> {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      project: { select: { client: { select: { userId: true } } } },
      escrow: true
    }
  });
  if (!contract) return fail("Contract not found", "NOT_FOUND");
  if (contract.project.client.userId !== userId) {
    return fail("Only the contract client can fund escrow", "FORBIDDEN");
  }
  if (contract.status !== ContractStatus.PENDING && contract.status !== ContractStatus.ACTIVE) {
    return fail("Contract cannot be funded in its current state", "BAD_STATE");
  }
  if (!contract.escrow) return fail("Escrow not found", "NOT_FOUND");
  return { ok: true, data: { contract } };
}

export async function createWalletFundingSession(
  userId: string,
  amount: number
): Promise<PaymentServiceResult<CheckoutSession>> {
  if (!isFlutterwaveConfigured()) {
    return fail("Payment provider is not configured", "PROVIDER_ERROR");
  }
  if (amount < PAYMENT_LIMITS.minWalletFund || amount > PAYMENT_LIMITS.maxWalletFund) {
    return fail("Amount is outside allowed funding limits", "VALIDATION");
  }

  const wallet = await ensureWalletForUser(userId);
  const user = await getUserEmail(userId);
  const txRef = generateTxRef("wallet");
  const baseUrl = paymentEnv.appUrl?.replace(/\/$/, "");

const redirectUrl =
  `${baseUrl}${PAYMENT_CALLBACK_PATH}?tx_ref=${encodeURIComponent(txRef)}`;
  const attempt = await prisma.paymentAttempt.create({
    data: {
      purpose: PaymentAttemptPurpose.WALLET_FUND,
      amount,
      currency: wallet.currency,
      txRef,
      userId,
      walletId: wallet.id,
      redirectUrl,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      metadata: { flow: "wallet_fund" }
    }
  });

  await addPendingDeposit(wallet.id, amount);

  try {
    const { checkoutUrl } = await initializeFlutterwavePayment({
      txRef,
      amount,
      currency: wallet.currency,
      email: user.email,
      name: user.name,
      redirectUrl,
      paymentAttemptId: attempt.id,
      meta: { purpose: "WALLET_FUND", userId, walletId: wallet.id }
    });

    await prisma.paymentAttempt.update({
      where: { id: attempt.id },
      data: { checkoutUrl }
    });

    return { ok: true, data: { attemptId: attempt.id, txRef, checkoutUrl } };
  } catch (e) {
    await prisma.paymentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: PaymentAttemptStatus.FAILED,
        failureReason: e instanceof Error ? e.message : "Initialization failed"
      }
    });
    return fail("Could not start payment session", "PROVIDER_ERROR");
  }
}

export async function createEscrowFundingSession(
  userId: string,
  contractId: string,
  amount?: number
): Promise<PaymentServiceResult<CheckoutSession>> {
  if (!isFlutterwaveConfigured()) {
    return fail("Payment provider is not configured", "PROVIDER_ERROR");
  }

  const access = await assertClientOwnsContract(userId, contractId);
  if (!access.ok) return access;

  const contract = access.data.contract;
  const { fundAmount } = computeEscrowFundAmount(
    contract.agreedAmount,
    contract.escrow!.fundedAmount,
    amount
  );
  if (fundAmount <= 0) return fail("Escrow is already fully funded", "BAD_STATE");
  if (fundAmount < PAYMENT_LIMITS.minEscrowFund || fundAmount > PAYMENT_LIMITS.maxEscrowFund) {
    return fail("Amount is outside allowed escrow limits", "VALIDATION");
  }

  const wallet = await ensureWalletForUser(userId);
  const user = await getUserEmail(userId);
  const txRef = generateTxRef("escrow");
  const baseUrl = paymentEnv.appUrl?.replace(/\/$/, "");

const redirectUrl =
  `${baseUrl}${PAYMENT_CALLBACK_PATH}?tx_ref=${encodeURIComponent(txRef)}`;
  const attempt = await prisma.paymentAttempt.create({
    data: {
      purpose: PaymentAttemptPurpose.ESCROW_FUND,
      amount: fundAmount,
      currency: contract.currency,
      txRef,
      userId,
      walletId: wallet.id,
      contractId,
      redirectUrl,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      metadata: { flow: "escrow_fund", contractId }
    }
  });

  try {
    const { checkoutUrl } = await initializeFlutterwavePayment({
      txRef,
      amount: fundAmount,
      currency: contract.currency,
      email: user.email,
      name: user.name,
      redirectUrl,
      paymentAttemptId: attempt.id,
      meta: { purpose: "ESCROW_FUND", contractId, userId }
    });

    await prisma.paymentAttempt.update({
      where: { id: attempt.id },
      data: { checkoutUrl }
    });

    return { ok: true, data: { attemptId: attempt.id, txRef, checkoutUrl } };
  } catch (e) {
    await prisma.paymentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: PaymentAttemptStatus.FAILED,
        failureReason: e instanceof Error ? e.message : "Initialization failed"
      }
    });
    return fail("Could not start escrow payment", "PROVIDER_ERROR");
  }
}

export async function fundEscrowFromWallet(
  userId: string,
  contractId: string,
  amount?: number
): Promise<PaymentServiceResult<{ contractId: string }>> {
  const access = await assertClientOwnsContract(userId, contractId);
  if (!access.ok) return access;

  const contract = access.data.contract;
  const { fundAmount } = computeEscrowFundAmount(
    contract.agreedAmount,
    contract.escrow!.fundedAmount,
    amount
  );
  if (fundAmount <= 0) return fail("Escrow is already fully funded", "BAD_STATE");

  const wallet = await ensureWalletForUser(userId);
  const idempotencyKey = generateIdempotencyKey(`escrow_wallet_${contractId}_${fundAmount}`);

  try {
    await prisma.$transaction(async (tx) => {
      const lock = await lockWalletForEscrow(tx, {
        walletId: wallet.id,
        amount: fundAmount,
        description: `Escrow funding for contract ${contractId}`,
        idempotencyKey
      });
      if (!lock.ok) throw new Error(lock.error);

      await applyEscrowFundingInTransaction(tx, {
        contractId,
        fundAmount,
        currency: contract.currency,
        note: "Wallet escrow funding"
      });

      const payment = await tx.payment.create({
        data: {
          amount: fundAmount,
          currency: contract.currency,
          status: PaymentStatus.SUCCEEDED,
          provider: PaymentProvider.INTERNAL,
          contractId,
          payerWalletId: wallet.id,
          txRef: idempotencyKey
        }
      });

      await tx.transaction.update({
        where: { id: lock.data.transactionId },
        data: { paymentId: payment.id }
      });
    });

    await createPaymentNotification({
      userId,
      type: "ESCROW",
      title: "Escrow funded",
      body: `You funded ${fundAmount} ${contract.currency} into contract escrow from your wallet.`,
      data: { contractId } satisfies import("@prisma/client").Prisma.JsonObject
    });

    return { ok: true, data: { contractId } };
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Escrow funding failed", "BAD_STATE");
  }
}

/**
 * Server-side verification — idempotent settlement for wallet / escrow checkout.
 */
export async function verifyAndSettlePayment(
  txRef: string,
  actingUserId?: string
): Promise<PaymentServiceResult<{ purpose: PaymentAttemptPurpose; contractId?: string }>> {
  const attempt = await prisma.paymentAttempt.findUnique({
    where: { txRef },
    include: { payment: true, user: { select: { email: true } } }
  });
  if (!attempt) return fail("Payment attempt not found", "NOT_FOUND");
  if (actingUserId && attempt.userId !== actingUserId) {
    return fail("Unauthorized payment verification", "FORBIDDEN");
  }

  if (attempt.status === PaymentAttemptStatus.SUCCEEDED && attempt.paymentId) {
    return {
      ok: true,
      data: { purpose: attempt.purpose, contractId: attempt.contractId ?? undefined }
    };
  }

  let payload;
  try {
    payload = await verifyFlutterwaveTransaction(txRef, { paymentAttemptId: attempt.id });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Verification failed", "PROVIDER_ERROR");
  }

  const validation = validateVerifiedCharge({
    payload,
    expectedAmount: Number(attempt.amount.toString()),
    expectedCurrency: attempt.currency,
    expectedTxRef: attempt.txRef,
    expectedEmail: attempt.user.email
  });
  if (!validation.ok) {
    await prisma.paymentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: PaymentAttemptStatus.FAILED,
        failureReason: validation.error
      }
    });
    return fail(validation.error, "BAD_STATE");
  }

  const flwRef = payload.data?.flw_ref ?? String(payload.data?.id ?? "");
  const idempotencyKey = generateIdempotencyKey(`settle_${attempt.txRef}`);

  await prisma.$transaction(async (tx) => {
    const fresh = await tx.paymentAttempt.findUnique({ where: { id: attempt.id } });
    if (!fresh) throw new Error("Attempt missing");
    if (fresh.status === PaymentAttemptStatus.SUCCEEDED) return;

    const payment = await tx.payment.upsert({
      where: { txRef: attempt.txRef },
      create: {
        amount: attempt.amount,
        currency: attempt.currency,
        status: PaymentStatus.SUCCEEDED,
        provider: PaymentProvider.FLUTTERWAVE,
        providerRef: flwRef,
        txRef: attempt.txRef,
        contractId: attempt.contractId,
        payerWalletId: attempt.walletId,
        metadata: JSON.parse(JSON.stringify({ flw: payload.data }))
      },
      update: {
        status: PaymentStatus.SUCCEEDED,
        providerRef: flwRef,
        metadata: JSON.parse(JSON.stringify({ flw: payload.data }))
      }
    });

    if (attempt.purpose === PaymentAttemptPurpose.WALLET_FUND && attempt.walletId) {
      await creditWalletAvailable(tx, {
        walletId: attempt.walletId,
        amount: Number(attempt.amount.toString()),
        type: TransactionType.DEPOSIT,
        description: "Wallet funding via Flutterwave",
        source: "flutterwave",
        paymentId: payment.id,
        idempotencyKey,
        metadata: { txRef: attempt.txRef, flwRef }
      });
    }

    if (
      attempt.purpose === PaymentAttemptPurpose.SUBSCRIPTION_UPGRADE &&
      attempt.metadata &&
      typeof attempt.metadata === "object"
    ) {
      const tier = (attempt.metadata as { tier?: string }).tier;
      if (tier && tier !== "FREE") {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        await tx.freelancerProfile.update({
          where: { userId: attempt.userId },
          data: {
            planTier: tier as import("@prisma/client").FreelancerPlanTier,
            planExpiresAt: expiresAt
          }
        });
      }
    }

    if (attempt.purpose === PaymentAttemptPurpose.ESCROW_FUND && attempt.contractId && attempt.walletId) {
      const fundAmount = Number(attempt.amount.toString());
      await creditWalletAvailable(tx, {
        walletId: attempt.walletId,
        amount: fundAmount,
        type: TransactionType.DEPOSIT,
        description: "Flutterwave payment for escrow",
        source: "flutterwave",
        paymentId: payment.id,
        idempotencyKey: `${idempotencyKey}_deposit`
      });

      const escrowRecord = await applyEscrowFundingInTransaction(tx, {
        contractId: attempt.contractId,
        fundAmount,
        currency: attempt.currency,
        note: "Flutterwave escrow funding"
      });

      await lockWalletForEscrow(tx, {
        walletId: attempt.walletId,
        amount: fundAmount,
        description: `Escrow lock for contract ${attempt.contractId}`,
        idempotencyKey: `${idempotencyKey}_lock`,
        escrowRecordId: escrowRecord.escrowRecordId
      });
    }

    await tx.paymentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: PaymentAttemptStatus.SUCCEEDED,
        flwRef,
        paymentId: payment.id,
        completedAt: new Date()
      }
    });
  });

  const notifType =
    attempt.purpose === PaymentAttemptPurpose.WALLET_FUND
      ? "PAYMENT"
      : attempt.purpose === PaymentAttemptPurpose.SUBSCRIPTION_UPGRADE
        ? "PAYMENT"
        : "ESCROW";
  const notifTitle =
    attempt.purpose === PaymentAttemptPurpose.WALLET_FUND
      ? "Wallet funded"
      : attempt.purpose === PaymentAttemptPurpose.SUBSCRIPTION_UPGRADE
        ? "Plan upgraded"
        : "Escrow funded";
  await createPaymentNotification({
    userId: attempt.userId,
    type: notifType,
    title: notifTitle,
    body: `Your payment of ${Number(attempt.amount)} ${attempt.currency} was confirmed.`,
    data: attempt.contractId
      ? ({ contractId: attempt.contractId } satisfies import("@prisma/client").Prisma.JsonObject)
      : undefined
  });

  return {
    ok: true,
    data: { purpose: attempt.purpose, contractId: attempt.contractId ?? undefined }
  };
}

export async function createWithdrawalRequest(
  userId: string,
  input: {
    amount: number;
    payoutMethod: string;
    payoutDetails: Record<string, string>;
  }
): Promise<PaymentServiceResult<{ withdrawalId: string }>> {
  if (input.amount < PAYMENT_LIMITS.minWithdrawal || input.amount > PAYMENT_LIMITS.maxWithdrawal) {
    return fail("Withdrawal amount is outside allowed limits", "VALIDATION");
  }

  const { wallet, snapshot } = await getWalletForUser(userId);
  if (snapshot.available + 0.0001 < input.amount) {
    return fail("Insufficient available balance", "BAD_STATE");
  }

  const idempotencyKey = generateIdempotencyKey(`withdraw_${userId}_${Date.now()}`);

  const row = await prisma.$transaction(async (tx) => {
    const withdrawal = await tx.withdrawalRequest.create({
      data: {
        walletId: wallet.id,
        amount: input.amount,
        currency: wallet.currency,
        status: WithdrawalStatus.PENDING,
        payoutMethod: input.payoutMethod,
        payoutDetails: input.payoutDetails
      }
    });

    const reserve = await reserveWithdrawal(tx, {
      walletId: wallet.id,
      amount: input.amount,
      withdrawalRequestId: withdrawal.id,
      idempotencyKey
    });
    if (!reserve.ok) throw new Error(reserve.error);

    await tx.transaction.update({
      where: { id: reserve.data.transactionId },
      data: { withdrawalRequestId: withdrawal.id }
    });

    return withdrawal;
  });

  await createPaymentNotification({
    userId,
    type: "WITHDRAWAL",
    title: "Withdrawal requested",
    body: `Your withdrawal of ${input.amount} ${wallet.currency} is pending review.`
  });

  return { ok: true, data: { withdrawalId: row.id } };
}

export async function processWithdrawal(
  adminUserId: string,
  withdrawalId: string,
  decision: "approve" | "reject" | "complete" | "fail",
  note?: string
): Promise<PaymentServiceResult<{ withdrawalId: string }>> {
  const admin = await prisma.user.findUnique({ where: { id: adminUserId }, select: { role: true } });
  if (!admin || admin.role !== Role.ADMIN) {
    return fail("Admin access required", "FORBIDDEN");
  }

  const withdrawal = await prisma.withdrawalRequest.findUnique({
    where: { id: withdrawalId },
    include: { wallet: true }
  });
  if (!withdrawal) return fail("Withdrawal not found", "NOT_FOUND");

  const nextStatus: WithdrawalStatus | null =
    decision === "approve"
      ? WithdrawalStatus.APPROVED
      : decision === "reject"
        ? WithdrawalStatus.REJECTED
        : decision === "complete"
          ? WithdrawalStatus.COMPLETED
          : decision === "fail"
            ? WithdrawalStatus.REJECTED
            : null;

  if (!nextStatus) return fail("Invalid decision", "VALIDATION");

  await prisma.withdrawalRequest.update({
    where: { id: withdrawalId },
    data: {
      status: nextStatus,
      reviewNote: note,
      reviewedAt: new Date()
    }
  });

  if (decision === "reject" || decision === "fail") {
    const amount = Number(withdrawal.amount.toString());
    await prisma.$transaction(async (tx) => {
      const w = await tx.wallet.findUnique({ where: { id: withdrawal.walletId } });
      if (!w) return;
      const bal = Number(w.balance.toString()) + amount;
      await tx.wallet.update({ where: { id: w.id }, data: { balance: bal } });
    });
  }

  return { ok: true, data: { withdrawalId } };
}

export async function getTransactionHistory(
  userId: string,
  filters: TransactionHistoryFilters = {}
) {
  const wallet = await ensureWalletForUser(userId);
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(50, Math.max(5, filters.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: Prisma.TransactionWhereInput = {
    walletId: wallet.id,
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.search
      ? {
          OR: [
            { reference: { contains: filters.search, mode: "insensitive" } },
            { description: { contains: filters.search, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const [rows, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        payment: { select: { contractId: true, contract: { select: { project: { select: { title: true } } } } } }
      }
    }),
    prisma.transaction.count({ where })
  ]);

  return {
    walletId: wallet.id,
    currency: wallet.currency,
    page,
    pageSize,
    total,
    rows
  };
}

export async function getWithdrawalsForUser(userId: string, take = 20) {
  const wallet = await ensureWalletForUser(userId);
  return prisma.withdrawalRequest.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: "desc" },
    take
  });
}

export { getWalletForUser, ensureWalletForUser, getWalletBalanceSnapshot };
