import type {
  PaymentAttemptPurpose,
  PaymentAttemptStatus,
  PaymentStatus,
  TransactionStatus,
  TransactionType,
  WithdrawalStatus
} from "@prisma/client";

export type PaymentServiceErrorCode =
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "CONFLICT"
  | "BAD_STATE"
  | "VALIDATION"
  | "PROVIDER_ERROR";

export type PaymentServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code: PaymentServiceErrorCode };

export type WalletBalanceSnapshot = {
  currency: string;
  available: number;
  locked: number;
  pending: number;
  withdrawn: number;
};

export type SerializedTransaction = {
  id: string;
  reference: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  description: string | null;
  source: string | null;
  balanceAfter: number | null;
  createdAt: string;
  contractId: string | null;
  contractTitle: string | null;
};

export type SerializedPaymentAttempt = {
  id: string;
  purpose: PaymentAttemptPurpose;
  status: PaymentAttemptStatus;
  amount: number;
  currency: string;
  txRef: string;
  checkoutUrl: string | null;
  createdAt: string;
};

export type SerializedWithdrawal = {
  id: string;
  amount: number;
  currency: string;
  status: WithdrawalStatus;
  payoutMethod: string;
  createdAt: string;
  reviewedAt: string | null;
};

export type CheckoutSession = {
  attemptId: string;
  txRef: string;
  checkoutUrl: string;
};

export type TransactionHistoryFilters = {
  type?: TransactionType;
  status?: TransactionStatus;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type FlutterwaveVerifyPayload = {
  status: string;
  message?: string;
  data?: {
    id: number;
    tx_ref: string;
    flw_ref?: string;
    amount: number;
    currency: string;
    status: string;
    customer?: { email?: string; name?: string };
    meta?: Record<string, unknown>;
  };
};

export type PaymentRowStatus = PaymentStatus;
