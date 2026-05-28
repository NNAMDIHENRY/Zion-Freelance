import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getMarketingPricingTiers } from "@/lib/subscriptions/marketing-pricing";
import { cn } from "@/lib/utils";

export type PricingTier = {
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  cta: { href: string; label: string };
  highlighted?: boolean;
};

type PricingCardsProps = {
  tiers: PricingTier[];
  className?: string;
};

export function PricingCards({ tiers, className }: PricingCardsProps) {
  return (
    <div
      className={cn(
        "grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8",
        className
      )}
    >
      {tiers.map((tier) => (
        <Card
          key={tier.name}
          className={cn(
            "relative flex flex-col overflow-hidden border-border/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
            tier.highlighted &&
              "border-violet-500/40 bg-gradient-to-b from-violet-500/[0.09] to-card shadow-subtle ring-1 ring-violet-500/25"
          )}
        >
          {tier.highlighted ? (
            <div className="absolute right-4 top-4 rounded-full bg-violet-600 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              Popular
            </div>
          ) : null}
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">{tier.name}</CardTitle>
            <CardDescription className="text-base">{tier.description}</CardDescription>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight">{tier.price}</span>
              <span className="text-sm text-muted-foreground">{tier.cadence}</span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col pt-2">
            <ul className="flex-1 space-y-3 text-sm text-muted-foreground">
              {tier.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              asChild
              className={cn("mt-8 w-full rounded-xl", tier.highlighted && "shadow-subtle")}
              variant={tier.highlighted ? "default" : "outline"}
            >
              <Link href={tier.cta.href}>{tier.cta.label}</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** @deprecated Use getMarketingPricingTiers() */
export const defaultPricingTiers: PricingTier[] = getMarketingPricingTiers();
