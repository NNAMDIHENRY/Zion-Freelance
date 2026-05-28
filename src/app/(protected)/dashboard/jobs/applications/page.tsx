import Link from "next/link";
import { redirect } from "next/navigation";

import { requireSessionUser } from "@/lib/jobs/auth";
import { prisma } from "@/lib/db";
import { WithdrawApplicationButton } from "@/components/jobs/WithdrawApplicationButton";

export const metadata = { title: "My applications | Dashboard" };

export default async function MyApplicationsPage() {
  const auth = await requireSessionUser();
  if (!auth.ok) redirect("/auth/login");

  const applications = await prisma.jobApplication.findMany({
    where: { applicantId: auth.userId },
    orderBy: { createdAt: "desc" },
    include: {
      job: { select: { id: true, title: true, slug: true, companyName: true, status: true } }
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My applications</h1>
      {applications.length === 0 ? (
        <p className="rounded-2xl border border-border/60 p-10 text-center text-sm text-muted-foreground">
          No applications yet.{" "}
          <Link href="/jobs" className="text-primary underline">
            Browse jobs
          </Link>
        </p>
      ) : (
        <ul className="space-y-4">
          {applications.map((app) => (
            <li
              key={app.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card p-5"
            >
              <div>
                <Link href={`/jobs/${app.job.slug}`} className="font-semibold hover:underline">
                  {app.job.title}
                </Link>
                <p className="text-sm text-muted-foreground">{app.job.companyName}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {app.status.replace(/_/g, " ")}
                </p>
              </div>
              {app.status !== "WITHDRAWN" && app.status !== "ACCEPTED" ? (
                <WithdrawApplicationButton applicationId={app.id} />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
