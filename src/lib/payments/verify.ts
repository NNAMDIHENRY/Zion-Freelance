import "server-only";

import {
  PaymentAttemptStatus,
  PaymentProvider,
  PaymentStatus,
  PaymentAttemptPurpose
} from "@prisma/client";

import type { FlutterwaveVerifyPayload } from "@/lib/payments/types";

const SUCCESS_STATUSES = new Set(["successful", "success"]);

export function isFlutterwaveChargeSuccessful(payload: FlutterwaveVerifyPayload): boolean {
  if (payload.status !== "success" || !payload.data) return false;
  return SUCCESS_STATUSES.has(String(payload.data.status).toLowerCase());
}

export function validateVerifiedCharge(params: {
  payload: FlutterwaveVerifyPayload;
  expectedAmount: number;
  expectedCurrency: string;
  expectedTxRef: string;
  expectedEmail?: string;
}): { ok: true } | { ok: false; error: string } {
  if (!isFlutterwaveChargeSuccessful(params.payload)) {
    return { ok: false, error: "Payment was not successful" };
  }

  const data = params.payload.data!;
  if (data.tx_ref !== params.expectedTxRef) {
    return { ok: false, error: "Transaction reference mismatch" };
  }

  const paid = Number(data.amount);
  if (Math.abs(paid - params.expectedAmount) > 0.01) {
    return { ok: false, error: "Paid amount does not match expected amount" };
  }

  const currency = String(data.currency).toUpperCase();
  if (currency !== params.expectedCurrency.toUpperCase()) {
    return { ok: false, error: "Currency mismatch" };
  }

  if (params.expectedEmail && data.customer?.email) {
    if (data.customer.email.toLowerCase() !== params.expectedEmail.toLowerCase()) {
      return { ok: false, error: "Customer email mismatch" };
    }
  }

  return { ok: true };
}

export function mapAttemptStatusFromPayment(paymentStatus: PaymentStatus): PaymentAttemptStatus {
  switch (paymentStatus) {
    case PaymentStatus.SUCCEEDED:
      return PaymentAttemptStatus.SUCCEEDED;
    case PaymentStatus.FAILED:
      return PaymentAttemptStatus.FAILED;
    case PaymentStatus.CANCELLED:
      return PaymentAttemptStatus.CANCELLED;
    case PaymentStatus.PROCESSING:
      return PaymentAttemptStatus.PROCESSING;
    default:
      return PaymentAttemptStatus.PENDING;
  }
}

export function providerFromPurpose(_purpose: PaymentAttemptPurpose): PaymentProvider {
  return PaymentProvider.FLUTTERWAVE;
}
