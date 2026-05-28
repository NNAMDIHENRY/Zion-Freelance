import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ApplicationStatusSelect } from "@/components/jobs/ApplicationStatusSelect";
import { requireVerifiedPoster } from "@/lib/jobs/auth";
import { prisma } from "@/lib/db";

export const metadata = { title: "Job applicants | Dashboard" };

export default async function JobApplicationsPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const auth = await requireVerifiedPoster();
  if (!auth.ok) redirect("/auth/verify-email");

  const { id } = await params;
  const job = await prisma.job.findFirst({
    where: { id, posterId: auth.userId },
    select: { id: true, title: true }
  });
  if (!job) notFound();

  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const statusFilter =
    typeof searchParams.status === "string" ? searchParams.status : undefined;

  const applications = await prisma.jobApplication.findMany({
    where: {
      jobId: id,
      ...(statusFilter ? { status: statusFilter as never } : {}),
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } }
            ]
          }
        : {})
    },
    orderBy: { createdAt: "desc" },
    include: { resumeFile: { select: { id: true, originalName: true } } }
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/jobs" className="text-sm text-primary underline">
          ← My jobs
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Applicants</h1>
        <p className="text-muted-foreground">{job.title}</p>
      </div>

      <form className="flex flex-wrap gap-3" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search applicants…"
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
        />
        <select
          name="status"
          defaultValue={statusFilter ?? ""}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="SHORTLISTED">Shortlisted</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <button
          type="submit"
          className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Filter
        </button>
      </form>

      {applications.length === 0 ? (
        <p className="rounded-xl border border-border/60 p-8 text-center text-sm text-muted-foreground">
          No applications yet.
        </p>
      ) : (
        <ul className="space-y-4">
          {applications.map((app) => (
            <li
              key={app.id}
              className="rounded-2xl border border-border/60 bg-card p-5 shadow-subtle"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{app.fullName}</p>
                  <p className="text-sm text-muted-foreground">{app.email}</p>
                </div>
                <ApplicationStatusSelect applicationId={app.id} current={app.status} />
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{app.coverLetter}</p>
              {app.resumeFile ? (
                <a
                  href={`/api/uploads/${app.resumeFile.id}`}
                  className="mt-2 inline-block text-sm text-primary underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download CV ({app.resumeFile.originalName})
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
