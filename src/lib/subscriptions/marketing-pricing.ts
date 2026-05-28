import { FreelancerPlanTier } from "@prisma/client";

import type { PricingTier } from "@/components/marketing/pricing-cards";

import { FREELANCER_PLANS } from "./plans";

/** Shared homepage / marketing pricing — mirrors dashboard upgrade plans. */
export function getMarketingPricingTiers(): PricingTier[] {
  const clientTier: PricingTier = {
    name: "Client",
    price: "$0",
    cadence: "/ mo",
    description: "Post unlimited projects and hire with escrow milestones.",
    features: [
      "Unlimited project posts",
      "Proposal review & messaging",
      "Milestone escrow funding",
      "Dispute & reporting tools"
    ],
    cta: { href: "/auth/register", label: "Post a project" }
  };

  const freelancerTiers: PricingTier[] = FREELANCER_PLANS.map((plan) => ({
    name: plan.name,
    price: plan.priceUsd === 0 ? "$0" : `$${plan.priceUsd}`,
    cadence: plan.cadence,
    description: plan.description,
    features: plan.features,
    cta:
      plan.tier === FreelancerPlanTier.FREE
        ? { href: "/auth/register", label: "Get started" }
        : { href: "/dashboard/settings/plan", label: `Upgrade to ${plan.name}` },
    highlighted: plan.tier === FreelancerPlanTier.PLUS
  }));

  return [clientTier, ...freelancerTiers];
}
