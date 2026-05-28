import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { StatCard } from "@/components/dashboard/widgets/StatCard";
import { getJobAnalytics } from "@/lib/jobs/analytics";
import { requireVerifiedPoster } from "@/lib/jobs/auth";

export const metadata = { title: "Job analytics | Dashboard" };

export default async function JobAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireVerifiedPoster();
  if (!auth.ok) redirect("/auth/verify-email");

  const { id } = await params;
  const data = await getJobAnalytics(id, auth.userId);
  if (!data) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard/jobs" className="text-sm text-primary underline">
          ← My jobs
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">{data.job.title}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Views" value={String(data.views)} />
        <StatCard title="Applications" value={String(data.applications)} />
        <StatCard title="Conversion" value={`${data.conversionRate}%`} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Recent applicants</h2>
        {data.recentApplicants.length === 0 ? (
          <p className="text-sm text-muted-foreground">No applications yet.</p>
        ) : (
          <ul className="space-y-2">
            {data.recentApplicants.map((a) => (
              <li
                key={a.id}
                className="flex justify-between rounded-lg border border-border/60 px-4 py-3 text-sm"
              >
                <span>{a.fullName}</span>
                <span className="text-muted-foreground">{a.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
