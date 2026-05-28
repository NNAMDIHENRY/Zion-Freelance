import { Role } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PlanUpgradePanel } from "@/components/subscriptions/PlanUpgradePanel";
import { getSession } from "@/lib/auth/session";
import { getFreelancerPlanForUser } from "@/lib/subscriptions/service";

export default async function PlanSettingsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/login");
  if (session.user.role !== Role.FREELANCER) redirect("/dashboard/settings");

  const plan = await getFreelancerPlanForUser(session.user.id);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/settings" className="text-primary hover:underline">
            Settings
          </Link>
          <span className="mx-2">/</span>
          <span>Plan</span>
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Freelancer plan</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Paid plans boost your visibility in search. Client project posting stays unlimited on all plans.
        </p>
      </header>
      <PlanUpgradePanel
        planTier={plan?.planTier ?? "FREE"}
        planExpiresAt={plan?.planExpiresAt?.toISOString() ?? null}
      />
    </div>
  );
}
