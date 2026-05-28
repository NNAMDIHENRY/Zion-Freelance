import Link from "next/link";
import { JobStatus } from "@prisma/client";
import { PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { requireVerifiedPoster } from "@/lib/jobs/auth";
import { getPosterJobs } from "@/lib/jobs/service";
import { redirect } from "next/navigation";
import { MyJobsActions } from "@/components/jobs/MyJobsActions";

export const metadata = { title: "My jobs | Dashboard" };

export default async function MyJobsPage() {
  const auth = await requireVerifiedPoster();
  if (!auth.ok) redirect("/auth/verify-email");

  const jobs = await getPosterJobs(auth.userId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My jobs</h1>
          <p className="text-sm text-muted-foreground">Create and manage your job postings.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/jobs/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Post a job
          </Link>
        </Button>
      </div>

      {jobs.length === 0 ? (
        <p className="rounded-2xl border border-border/60 bg-card p-10 text-center text-sm text-muted-foreground">
          No jobs yet.{" "}
          <Link href="/dashboard/jobs/new" className="text-primary underline">
            Post your first job
          </Link>
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/60">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Apps</th>
                <th className="px-4 py-3">Views</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} className="border-b border-border/40">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/jobs/${j.id}/edit`} className="font-medium hover:underline">
                      {j.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{j.category.name}</p>
                  </td>
                  <td className="px-4 py-3">{j.status}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/jobs/${j.id}/applications`}
                      className="text-primary underline"
                    >
                      {j._count.applications}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{j.viewCount}</td>
                  <td className="px-4 py-3">
                    <MyJobsActions jobId={j.id} status={j.status as JobStatus} slug={j.slug} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
