import { FreelancerPlanTier } from "@prisma/client";

export type PlanDefinition = {
  tier: FreelancerPlanTier;
  name: string;
  priceUsd: number;
  cadence: string;
  description: string;
  features: string[];
  searchBoost: number;
};

export const FREELANCER_PLANS: PlanDefinition[] = [
  {
    tier: FreelancerPlanTier.FREE,
    name: "Starter",
    priceUsd: 0,
    cadence: "/ mo",
    description: "Get started and apply to open projects.",
    features: ["Public profile", "Unlimited proposals", "Standard search placement"],
    searchBoost: 0
  },
  {
    tier: FreelancerPlanTier.PLUS,
    name: "Plus",
    priceUsd: 19,
    cadence: "/ mo",
    description: "Rank higher in client search and talent spotlights.",
    features: ["Priority search ranking", "Featured eligibility", "Profile highlight badge"],
    searchBoost: 1
  },
  {
    tier: FreelancerPlanTier.PRO,
    name: "Pro",
    priceUsd: 49,
    cadence: "/ mo",
    description: "Maximum visibility for top freelancers.",
    features: ["Top search placement", "Homepage featured pool", "Verified-style highlight"],
    searchBoost: 2
  }
];

export function planByTier(tier: FreelancerPlanTier) {
  return FREELANCER_PLANS.find((p) => p.tier === tier) ?? FREELANCER_PLANS[0]!;
}

export function isPlanActive(planTier: FreelancerPlanTier, planExpiresAt: Date | null) {
  if (planTier === FreelancerPlanTier.FREE) return true;
  if (!planExpiresAt) return false;
  return planExpiresAt.getTime() > Date.now();
}

export function effectivePlanTier(planTier: FreelancerPlanTier, planExpiresAt: Date | null) {
  return isPlanActive(planTier, planExpiresAt) ? planTier : FreelancerPlanTier.FREE;
}
