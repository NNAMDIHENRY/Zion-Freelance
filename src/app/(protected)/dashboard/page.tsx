import { Role } from "@prisma/client";

import { TutorialCoach } from "@/components/onboarding/TutorialCoach";
import { AnalyticsCard } from "@/components/dashboard/widgets/AnalyticsCard";
import { StatCard } from "@/components/dashboard/widgets/StatCard";
import { getSession } from "@/lib/auth/session";
import { getUserRole } from "@/lib/auth/role";
import { getDashboardStats } from "@/lib/dashboard/stats";

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
        sub: "Monitor users, payouts, and platform health."
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
  if (!role || !session?.user?.id) {
    return null;
  }

  const copy = roleCopy(role);
  const stats = await getDashboardStats(session.user.id, role);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{copy.headline}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{copy.sub}</p>
      </div>

      {role === Role.CLIENT || role === Role.FREELANCER ? <TutorialCoach /> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Active pipeline"
          value={String(stats.activePipeline)}
          description={stats.pipelineTrend ?? "Open work and pending items."}
          trend="up"
        />
        <StatCard
          title="Win rate"
          value={stats.winRate ?? "—"}
          description={
            role === Role.FREELANCER ? "Accepted proposals vs submitted." : "Freelancer metric."
          }
          trend={stats.winRate ? "up" : "neutral"}
        />
        <StatCard
          title={role === Role.FREELANCER ? "Wallet balance" : "Spend / earnings"}
          value={stats.spendOrEarnings}
          description={stats.spendTrend ?? "From your account activity."}
          trend="neutral"
        />
        <StatCard
          title="Health"
          value={stats.slaHealth}
          description="Operational status for your account."
          trend="up"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <AnalyticsCard
          title="Throughput"
          description="Proposal and contract activity over time."
        />
        <AnalyticsCard
          title="Quality"
          description="Reviews and satisfaction signals from completed work."
        />
      </div>
    </div>
  );
}
