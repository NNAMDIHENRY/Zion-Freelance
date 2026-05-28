import "server-only";

import { createHash } from "crypto";

import {
  PaymentAttemptStatus,
  PaymentProvider,
  WebhookProcessingStatus,
  type Prisma
} from "@prisma/client";

import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/payments/flutterwave/client";
import { verifyAndSettlePayment } from "@/lib/payments/service";

type FlutterwaveWebhookBody = {
  event?: string;
  data?: {
    id?: number;
    tx_ref?: string;
    status?: string;
    amount?: number;
    currency?: string;
    flw_ref?: string;
  };
};

function deriveEventId(body: FlutterwaveWebhookBody, raw: string): string {
  const txRef = body.data?.tx_ref;
  const event = body.event ?? "unknown";
  const id = body.data?.id;
  if (id != null) return `flw_${event}_${id}`;
  if (txRef) return `flw_${event}_${txRef}`;
  return `flw_${event}_${createHash("sha256").update(raw).digest("hex").slice(0, 24)}`;
}

export async function processFlutterwaveWebhook(params: {
  rawBody: string;
  verifHash: string | null;
}): Promise<{ ok: boolean; status: number; message: string }> {
  let body: FlutterwaveWebhookBody;
  try {
    body = JSON.parse(params.rawBody) as FlutterwaveWebhookBody;
  } catch {
    return { ok: false, status: 400, message: "Invalid JSON" };
  }

  const signatureValid = verifyWebhookSignature(params.verifHash);
  const eventId = deriveEventId(body, params.rawBody);
  const eventType = body.event ?? "unknown";

  const existing = await prisma.webhookEvent.findUnique({ where: { eventId } });
  if (existing?.status === WebhookProcessingStatus.PROCESSED) {
    return { ok: true, status: 200, message: "Already processed" };
  }

  const webhookRow =
    existing ??
    (await prisma.webhookEvent.create({
      data: {
        eventId,
        eventType,
        provider: PaymentProvider.FLUTTERWAVE,
        signatureValid,
        status: WebhookProcessingStatus.RECEIVED,
        payload: body as Prisma.InputJsonValue
      }
    }));

  if (!signatureValid) {
    await prisma.webhookEvent.update({
      where: { id: webhookRow.id },
      data: {
        status: WebhookProcessingStatus.FAILED,
        errorMessage: "Invalid webhook signature"
      }
    });
    return { ok: false, status: 401, message: "Invalid signature" };
  }

  await prisma.webhookEvent.update({
    where: { id: webhookRow.id },
    data: { status: WebhookProcessingStatus.PROCESSING }
  });

  const txRef = body.data?.tx_ref;
  const successEvents = new Set([
    "charge.completed",
    "checkout.completed",
    "transfer.completed"
  ]);
  const failEvents = new Set(["charge.failed", "transfer.failed"]);

  try {
    if (txRef && successEvents.has(eventType)) {
      const result = await verifyAndSettlePayment(txRef);
      if (!result.ok) {
        await prisma.webhookEvent.update({
          where: { id: webhookRow.id },
          data: {
            status: WebhookProcessingStatus.FAILED,
            errorMessage: result.error,
            processedAt: new Date()
          }
        });
        return { ok: false, status: 422, message: result.error };
      }
    } else if (txRef && failEvents.has(eventType)) {
      await prisma.paymentAttempt.updateMany({
        where: { txRef },
        data: {
          status: PaymentAttemptStatus.FAILED,
          failureReason: `Webhook: ${eventType}`
        }
      });
    } else {
      await prisma.webhookEvent.update({
        where: { id: webhookRow.id },
        data: { status: WebhookProcessingStatus.IGNORED, processedAt: new Date() }
      });
      return { ok: true, status: 200, message: "Event ignored" };
    }

    await prisma.webhookEvent.update({
      where: { id: webhookRow.id },
      data: { status: WebhookProcessingStatus.PROCESSED, processedAt: new Date() }
    });
    return { ok: true, status: 200, message: "Processed" };
  } catch (e) {
    await prisma.webhookEvent.update({
      where: { id: webhookRow.id },
      data: {
        status: WebhookProcessingStatus.FAILED,
        errorMessage: e instanceof Error ? e.message : "Processing error",
        processedAt: new Date()
      }
    });
    return { ok: false, status: 500, message: "Processing failed" };
  }
}
