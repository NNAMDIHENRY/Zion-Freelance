import "server-only";

import {
  FreelancerPlanTier,
  PaymentAttemptPurpose,
  PaymentAttemptStatus,
  PaymentProvider,
  PaymentStatus,
  Role
} from "@prisma/client";

import { prisma } from "@/lib/db";
import { isFlutterwaveConfigured, paymentEnv } from "@/lib/env/payments";
import { PAYMENT_CALLBACK_PATH } from "@/lib/payments/constants";
import { initializeFlutterwavePayment } from "@/lib/payments/flutterwave/client";
import { generateTxRef } from "@/lib/payments/references";
import { FREELANCER_PLANS, planByTier } from "@/lib/subscriptions/plans";

export async function createSubscriptionUpgradeSession(userId: string, tier: FreelancerPlanTier) {
  const plan = planByTier(tier);
  if (plan.priceUsd <= 0) {
    return { ok: false as const, error: "This plan is free" };
  }
  if (!isFlutterwaveConfigured()) {
    return { ok: false as const, error: "Payment provider is not configured" };
  }

  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId },
    select: { id: true }
  });
  if (!profile) return { ok: false as const, error: "Freelancer profile required" };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true }
  });
  if (!user) return { ok: false as const, error: "User not found" };

  const txRef = generateTxRef("plan");
  const redirectUrl = `${paymentEnv.appUrl}${PAYMENT_CALLBACK_PATH}?tx_ref=${encodeURIComponent(txRef)}&plan=${tier}`;

  const attempt = await prisma.paymentAttempt.create({
    data: {
      purpose: PaymentAttemptPurpose.SUBSCRIPTION_UPGRADE,
      amount: plan.priceUsd,
      currency: "USD",
      txRef,
      userId,
      redirectUrl,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      metadata: { tier, planName: plan.name }
    }
  });

  try {
    const { checkoutUrl } = await initializeFlutterwavePayment({
      txRef,
      amount: plan.priceUsd,
      currency: "USD",
      email: user.email,
      name: user.name,
      redirectUrl,
      paymentAttemptId: attempt.id,
      meta: { purpose: "SUBSCRIPTION_UPGRADE", tier, userId }
    });

    await prisma.paymentAttempt.update({
      where: { id: attempt.id },
      data: { checkoutUrl }
    });

    return { ok: true as const, data: { checkoutUrl, txRef } };
  } catch (e) {
    console.error("CHECKOUT ERROR FULL:", e);
  
    await prisma.paymentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: PaymentAttemptStatus.FAILED,
        failureReason: e instanceof Error ? e.message : JSON.stringify(e)
      }
    });
  
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Could not start checkout"
    };
  }
}

export async function activateSubscriptionFromAttempt(attemptId: string) {
  const attempt = await prisma.paymentAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.purpose !== PaymentAttemptPurpose.SUBSCRIPTION_UPGRADE) return;

  const meta = attempt.metadata as { tier?: FreelancerPlanTier } | null;
  const tier = meta?.tier;
  if (!tier || tier === FreelancerPlanTier.FREE) return;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await prisma.freelancerProfile.update({
    where: { userId: attempt.userId },
    data: { planTier: tier, planExpiresAt: expiresAt }
  });
}

export async function getFreelancerPlanForUser(userId: string) {
  const profile = await prisma.freelancerProfile.findUnique({
    where: { userId },
    select: { planTier: true, planExpiresAt: true }
  });
  if (!profile) return null;
  return profile;
}
