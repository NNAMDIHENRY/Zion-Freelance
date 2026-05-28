import { TransactionType, TransactionStatus } from "@prisma/client";
import { z } from "zod";

import { PAYMENT_LIMITS } from "@/lib/payments/constants";

export const walletFundSchema = z.object({
  amount: z
    .number()
    .min(PAYMENT_LIMITS.minWalletFund, `Minimum funding is ${PAYMENT_LIMITS.minWalletFund}`)
    .max(PAYMENT_LIMITS.maxWalletFund, `Maximum funding is ${PAYMENT_LIMITS.maxWalletFund}`)
});

export const escrowFundSchema = z.object({
  contractId: z.string().min(1),
  amount: z
    .number()
    .min(PAYMENT_LIMITS.minEscrowFund)
    .max(PAYMENT_LIMITS.maxEscrowFund)
    .optional(),
  method: z.enum(["wallet", "flutterwave"])
});

export const withdrawalSchema = z.object({
  amount: z
    .number()
    .min(PAYMENT_LIMITS.minWithdrawal)
    .max(PAYMENT_LIMITS.maxWithdrawal),
  payoutMethod: z.enum(["bank_transfer", "mobile_money"]),
  accountName: z.string().min(2).max(120),
  accountNumber: z.string().min(4).max(40),
  bankCode: z.string().max(20).optional(),
  bankName: z.string().max(120).optional()
});

export const transactionHistorySchema = z.object({
  type: z.nativeEnum(TransactionType).optional(),
  status: z.nativeEnum(TransactionStatus).optional(),
  search: z.string().max(80).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(5).max(50).optional()
});

export const verifyPaymentSchema = z.object({
  txRef: z.string().min(8)
});
