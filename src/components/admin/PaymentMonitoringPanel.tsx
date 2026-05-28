import { StatCard } from "@/components/dashboard/widgets/StatCard";

type Summary = {
  totalVolume: number;
  completedCount: number;
  pendingCount: number;
  failedCount: number;
  suspiciousCount: number;
};

type PaymentRow = {
  id: string;
  amount: string;
  currency: string;
  status: string;
  provider: string;
  projectTitle: string;
  payerName: string;
  createdAt: string;
  failureReason: string | null;
};

export function PaymentMonitoringPanel({
  summary,
  payments
}: {
  summary: Summary;
  payments: PaymentRow[];
}) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total volume"
          value={`$${summary.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        />
        <StatCard title="Completed" value={String(summary.completedCount)} />
        <StatCard title="Pending" value={String(summary.pendingCount)} />
        <StatCard
          title="Suspicious (7d)"
          value={String(summary.suspiciousCount)}
          description={`${summary.failedCount} failed overall`}
        />
      </section>

      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card shadow-subtle">
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30 text-left text-xs uppercase text-muted-foreground">
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Payer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  No payments match filters.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="border-b border-border/40">
                  <td className="px-4 py-3">
                    {p.amount} {p.currency}
                    <span className="ml-2 text-xs text-muted-foreground">{p.provider}</span>
                  </td>
                  <td className="px-4 py-3">{p.projectTitle}</td>
                  <td className="px-4 py-3">{p.payerName}</td>
                  <td className="px-4 py-3">
                    {p.status}
                    {p.failureReason ? (
                      <p className="text-xs text-rose-600">{p.failureReason}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(p.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
