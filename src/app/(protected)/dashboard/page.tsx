import { Role } from "@prisma/client";

import { AnalyticsCard } from "@/components/dashboard/widgets/AnalyticsCard";
import { StatCard } from "@/components/dashboard/widgets/StatCard";
import { getSession } from "@/lib/auth/session";
import { getUserRole } from "@/lib/auth/role";

function roleCopy(role: Role) {
  switch (role) {
    case Role.FREELANCER:
      return {
        headline: "Freelancer overview",
        sub: "Track proposals, active work, and payouts in one calm surface."
      };
    case Role.ADMIN:
      return {
        headline: "Admin overview",
        sub: "Monitor users and platform health — deeper tooling arrives in later modules."
      };
    default:
      return {
        headline: "Client overview",
        sub: "Post roles, compare proposals, and keep spend predictable."
      };
  }
}

export default async function DashboardPage() {
  const session = await getSession();
  const role = getUserRole(session);
  if (!role) {
    return null;
  }

  const copy = roleCopy(role);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{copy.headline}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{copy.sub}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Active pipeline"
          value={role === Role.CLIENT ? "6" : role === Role.FREELANCER ? "4" : "128"}
          description="Illustrative placeholder metrics."
          trend="up"
          trendLabel="+12%"
        />
        <StatCard
          title="Win rate"
          value={role === Role.FREELANCER ? "38%" : "—"}
          description={role === Role.FREELANCER ? "Rolling 90 days (mock)." : "Shown for freelancer accounts."}
          trend={role === Role.FREELANCER ? "up" : "neutral"}
          trendLabel={role === Role.FREELANCER ? "+4 pts" : undefined}
        />
        <StatCard
          title="Spend / earnings"
          value={
            role === Role.CLIENT ? "$12.4k" : role === Role.FREELANCER ? "$8.1k" : "32 open items"
          }
          description={
            role === Role.ADMIN
              ? "Operational queue depth (illustrative)."
              : "Connect payouts to populate this card."
          }
          trend="neutral"
        />
        <StatCard
          title="SLA health"
          value="99.2%"
          description="Uptime-style signal for admins; mock for others."
          trend="up"
          trendLabel="+0.1%"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AnalyticsCard
          title="Throughput"
          description="Stacked area or bar chart lands here without pulling new dependencies."
        />
        <AnalyticsCard
          title="Quality"
          description="Pair CSAT / dispute rate visuals once analytics APIs exist."
        />
      </div>
    </div>
  );
}
