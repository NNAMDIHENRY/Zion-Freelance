"use client";

import { FreelancerPlanTier } from "@prisma/client";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FREELANCER_PLANS, effectivePlanTier } from "@/lib/subscriptions/plans";
import { cn } from "@/lib/utils";

export function PlanUpgradePanel({
  planTier,
  planExpiresAt
}: {
  planTier: FreelancerPlanTier;
  planExpiresAt: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);
  const active = effectivePlanTier(
    planTier,
    planExpiresAt ? new Date(planExpiresAt) : null
  );

  async function upgrade(tier: FreelancerPlanTier) {
    if (tier === FreelancerPlanTier.FREE) return;
    setPending(tier);
    try {
      const res = await fetch("/api/subscriptions/upgrade", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tier })
      });
      const j = (await res.json()) as { checkoutUrl?: string; error?: string };
      if (!res.ok || !j.checkoutUrl) {
        toast.error(j.error ?? "Checkout unavailable");
        return;
      }
      window.location.href = j.checkoutUrl;
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Current plan: <span className="font-semibold text-foreground">{active}</span>
        {planExpiresAt && active !== FreelancerPlanTier.FREE ? (
          <span> · renews / expires {new Date(planExpiresAt).toLocaleDateString()}</span>
        ) : null}
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {FREELANCER_PLANS.map((plan) => {
          const isCurrent = active === plan.tier;
          return (
            <Card
              key={plan.tier}
              className={cn(
                "flex flex-col",
                plan.tier === FreelancerPlanTier.PLUS && "border-violet-500/40"
              )}
            >
              <CardHeader>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="pt-2 text-2xl font-semibold">
                  ${plan.priceUsd}
                  <span className="text-sm font-normal text-muted-foreground">{plan.cadence}</span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="flex-1 space-y-2 text-sm text-muted-foreground">
                  {plan.features.map((f) => (
                    <li key={f}>· {f}</li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full"
                  variant={isCurrent ? "secondary" : "default"}
                  disabled={isCurrent || !!pending || plan.priceUsd === 0}
                  onClick={() => void upgrade(plan.tier)}
                >
                  {isCurrent
                    ? "Current plan"
                    : pending === plan.tier
                      ? "Redirecting…"
                      : plan.priceUsd === 0
                        ? "Included"
                        : "Upgrade"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={() => router.refresh()}>
        Refresh plan status
      </Button>
    </div>
  );
}
