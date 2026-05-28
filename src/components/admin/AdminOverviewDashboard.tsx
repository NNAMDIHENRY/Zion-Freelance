import Link from "next/link";

import { StatCard } from "@/components/dashboard/widgets/StatCard";
import type { getAdminOverviewKpis } from "@/lib/admin/analytics/service";

type OverviewProps = {
  data: Awaited<ReturnType<typeof getAdminOverviewKpis>>;
};

export function AdminOverviewDashboard({ data }: OverviewProps) {
  const { analytics } = data;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((kpi) => (
          <StatCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            className={kpi.alert ? "border-amber-500/40" : undefined}
          />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-subtle lg:col-span-2">
          <h2 className="text-sm font-semibold">Platform health</h2>
          <ul className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <li>
              <span className="text-muted-foreground">New users (30d)</span>
              <p className="font-medium">{analytics.users.newUsers}</p>
            </li>
            <li>
              <span className="text-muted-foreground">Active users (30d)</span>
              <p className="font-medium">{analytics.users.activeUsers}</p>
            </li>
            <li>
              <span className="text-muted-foreground">Pending payments</span>
              <p className="font-medium">{analytics.financial.pendingPayments}</p>
            </li>
            <li>
              <span className="text-muted-foreground">Failed payments</span>
              <p className="font-medium">{analytics.financial.failedPayments}</p>
            </li>
            <li>
              <span className="text-muted-foreground">Open disputes</span>
              <p className="font-medium">{analytics.marketplace.openDisputes}</p>
            </li>
            <li>
              <span className="text-muted-foreground">Escrow utilization</span>
              <p className="font-medium">{analytics.financial.escrowUtilization}%</p>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-subtle">
          <h2 className="text-sm font-semibold">Quick links</h2>
          <nav className="mt-4 flex flex-col gap-2 text-sm">
            <Link href="/admin/moderation" className="text-primary hover:underline">
              Moderation queue
            </Link>
            <Link href="/admin/withdrawals" className="text-primary hover:underline">
              Withdrawal approvals
            </Link>
            <Link href="/admin/disputes" className="text-primary hover:underline">
              Dispute center
            </Link>
            <Link href="/admin/analytics" className="text-primary hover:underline">
              Analytics dashboard
            </Link>
          </nav>
        </div>
      </section>
    </div>
  );
}
