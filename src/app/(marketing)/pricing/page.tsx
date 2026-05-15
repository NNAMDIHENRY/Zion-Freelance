import type { Metadata } from "next";

import { FeatureSection, PricingCards, defaultPricingTiers } from "@/components/marketing";
import { PricingComparison } from "@/components/marketing/pricing-comparison";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple pricing tiers for Zion TeCHer—Starter, Professional, and Enterprise—with a comparison table for features and support."
};

export default function PricingPage() {
  return (
    <>
      <div className="border-b border-border/40 bg-gradient-to-br from-violet-500/[0.06] via-background to-cyan-500/[0.05]">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
              Pricing
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Plans that flex with your hiring volume.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Start free and graduate when you need premium visibility, faster support, and advanced
              collaboration. Enterprise programs map to your procurement and security requirements.
            </p>
          </div>
        </div>
      </div>

      <FeatureSection
        eyebrow="Tiers"
        title="Choose where to begin."
        description="Every tier includes access to the marketplace. Upgrade when your team is ready for spotlight placement and deeper tooling."
      >
        <PricingCards tiers={defaultPricingTiers} />
      </FeatureSection>

      <FeatureSection
        eyebrow="Compare"
        title="Capability comparison."
        description="A concise view of how Starter, Professional, and Enterprise stack—perfect for sharing with stakeholders."
        className="border-t border-border/40 bg-muted/10"
      >
        <PricingComparison />
      </FeatureSection>
    </>
  );
}
