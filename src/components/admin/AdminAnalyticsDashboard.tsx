import { StatCard } from "@/components/dashboard/widgets/StatCard";
import { AnalyticsCard } from "@/components/dashboard/widgets/AnalyticsCard";
import type { getPlatformAnalytics } from "@/lib/admin/analytics/service";

export function AdminAnalyticsDashboard({
  data
}: {
  data: Awaited<ReturnType<typeof getPlatformAnalytics>>;
}) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Users
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total users" value={String(data.users.totalUsers)} />
          <StatCard title="New (30d)" value={String(data.users.newUsers)} />
          <StatCard title="Active (30d)" value={String(data.users.activeUsers)} />
          <StatCard title="Suspended" value={String(data.users.suspendedUsers)} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Marketplace
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Active projects" value={String(data.marketplace.activeProjects)} />
          <StatCard title="Completed projects" value={String(data.marketplace.completedProjects)} />
          <StatCard title="Open disputes" value={String(data.marketplace.openDisputes)} />
          <StatCard title="Dispute ratio" value={`${data.marketplace.disputeRatio}%`} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Financial
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <AnalyticsCard title="Platform volume" description="Succeeded payments">
            <p className="text-2xl font-semibold">
              ${data.financial.platformVolume.toLocaleString()}
            </p>
          </AnalyticsCard>
          <AnalyticsCard title="Escrow" description="Funded vs utilization">
            <p className="text-2xl font-semibold">{data.financial.escrowUtilization}% utilized</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Withdrawals completed: ${data.financial.withdrawalsTotal.toLocaleString()}
            </p>
          </AnalyticsCard>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Operations
        </h2>
        <StatCard
          title="Moderation queue depth"
          value={String(data.operations.moderationQueue)}
          description={`${data.operations.openReports} reports · ${data.operations.pendingReviews} reviews pending`}
        />
      </section>
    </div>
  );
}
