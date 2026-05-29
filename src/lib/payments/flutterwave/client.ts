import "server-only";

import type { RequestInit } from "next/dist/server/web/spec-extension/request";
import { PaymentProvider } from "@prisma/client";

import { assertFlutterwaveEnv, paymentEnv } from "@/lib/env/payments";
import { prisma } from "@/lib/db";
import type { FlutterwaveVerifyPayload } from "@/lib/payments/types";

type InitializePaymentInput = {
  txRef: string;
  amount: number;
  currency: string;
  email: string;
  name: string;
  redirectUrl: string;
  meta?: Record<string, string>;
  paymentAttemptId: string;
};

type FlutterwaveInitResponse = {
  status: string;
  message: string;
  data?: {
    link: string;
  };
};

export async function logProviderCall(params: {
  direction: string;
  endpoint?: string;
  statusCode?: number;
  success: boolean;
  payload?: unknown;
  errorMessage?: string;
  paymentAttemptId?: string;
  paymentId?: string;
}) {
  // OPTIONAL LOGGING
  // Uncomment later if you add PaymentProviderLog model

  /*
  await prisma.paymentProviderLog.create({
    data: {
      provider: PaymentProvider.FLUTTERWAVE,
      direction: params.direction,
      endpoint: params.endpoint,
      statusCode: params.statusCode,
      success: params.success,
      payload: params.payload as object | undefined,
      errorMessage: params.errorMessage,
      paymentAttemptId: params.paymentAttemptId,
      paymentId: params.paymentId
    }
  });
  */
}

async function flutterwaveFetch<T>(
  path: string,
  init: RequestInit,
  ctx?: { paymentAttemptId?: string; paymentId?: string }
): Promise<T> {
  const { secret } = assertFlutterwaveEnv();

  const base =
    paymentEnv.flutterwaveBaseUrl ??
    "https://api.flutterwave.com/v3";

  const url = `${base}${path}`;

  console.log("FLUTTERWAVE URL:", url);

  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers ?? {})
    }
  });

  const text = await res.text();

  let body;

  try {
    body = JSON.parse(text);
  } catch {
    body = { message: text };
  }

  console.log("FLUTTERWAVE RESPONSE:", body);

  await logProviderCall({
    direction: "response",
    endpoint: path,
    statusCode: res.status,
    success: res.ok,
    payload: body,
    paymentAttemptId: ctx?.paymentAttemptId,
    paymentId: ctx?.paymentId,
    errorMessage: res.ok
      ? undefined
      : (body as { message?: string }).message
  });

  if (!res.ok) {
    throw new Error(
      (body as { message?: string }).message ??
        "Flutterwave request failed"
    );
  }

  return body;
}

export async function initializeFlutterwavePayment(
  input: InitializePaymentInput
) {
  const payload = {
    tx_ref: input.txRef,

    amount: Number(input.amount),

    currency: input.currency,

    redirect_url: input.redirectUrl,

    payment_options: "card,banktransfer,ussd",

    customer: {
      email: input.email,
      name: input.name
    },

    customizations: {
      title: "Zion TeCHer",
      description:
        input.meta?.purpose === "ESCROW_FUND"
          ? "Contract escrow funding"
          : input.meta?.purpose === "SUBSCRIPTION_UPGRADE"
            ? "Subscription upgrade"
            : "Wallet funding"
    },

    meta: input.meta ?? {}
  };

  console.log(
    "FLUTTERWAVE REQUEST PAYLOAD:",
    JSON.stringify(payload, null, 2)
  );

  await logProviderCall({
    direction: "request",
    endpoint: "/payments",
    success: true,
    payload,
    paymentAttemptId: input.paymentAttemptId
  });

  const res = await flutterwaveFetch<FlutterwaveInitResponse>(
    "/payments",
    {
      method: "POST",
      body: JSON.stringify(payload)
    },
    {
      paymentAttemptId: input.paymentAttemptId
    }
  );

  console.log("FLUTTERWAVE RAW RESPONSE:", res);

  if (res.status !== "success" || !res.data?.link) {
    throw new Error(
      res.message ?? "Failed to initialize payment"
    );
  }

  return {
    checkoutUrl: res.data.link
  };
}

export async function verifyFlutterwaveTransaction(
  txRef: string,
  ctx?: { paymentAttemptId?: string; paymentId?: string }
): Promise<FlutterwaveVerifyPayload> {
  const encoded = encodeURIComponent(txRef);

  return flutterwaveFetch<FlutterwaveVerifyPayload>(
    `/transactions/verify_by_reference?tx_ref=${encoded}`,
    {
      method: "GET"
    },
    ctx
  );
}

export function verifyWebhookSignature(
  receivedHash: string | null
): boolean {
  const { webhook } = assertFlutterwaveEnv();

  if (!receivedHash) return false;

  return receivedHash === webhook;
}