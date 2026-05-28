import Link from "next/link";
import { redirect } from "next/navigation";
import { JobStatus } from "@prisma/client";

import { JobCard } from "@/components/jobs/JobCard";
import { requireSessionUser } from "@/lib/jobs/auth";
import { prisma } from "@/lib/db";
import type { JobSearchRow } from "@/lib/jobs/search/types";

export const metadata = { title: "Saved jobs | Dashboard" };

export default async function SavedJobsPage() {
  const auth = await requireSessionUser();
  if (!auth.ok) redirect("/auth/login");

  const saved = await prisma.savedJob.findMany({
    where: { userId: auth.userId, job: { status: JobStatus.ACTIVE } },
    orderBy: { createdAt: "desc" },
    include: {
      job: {
        include: {
          category: { select: { name: true } },
          skills: { take: 8, include: { skill: { select: { name: true } } } }
        }
      }
    }
  });

  const items: JobSearchRow[] = saved.map(({ job: r }) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    shortDescription: r.shortDescription,
    companyName: r.companyName,
    workMode: r.workMode,
    employmentType: r.employmentType,
    experienceLevel: r.experienceLevel,
    salaryMin: r.salaryMin?.toString() ?? null,
    salaryMax: r.salaryMax?.toString() ?? null,
    salaryType: r.salaryType,
    currency: r.currency,
    city: r.city,
    country: r.country,
    categoryName: r.category.name,
    skills: r.skills.map((s) => s.skill.name),
    featured: r.featured,
    urgentHiring: r.urgentHiring,
    verifiedEmployerBadge: r.verifiedEmployerBadge,
    applicationDeadline: r.applicationDeadline?.toISOString() ?? null,
    publishedAt: r.publishedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString()
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Saved jobs</h1>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-border/60 p-10 text-center text-sm text-muted-foreground">
          No saved jobs.{" "}
          <Link href="/jobs" className="text-primary underline">
            Browse jobs
          </Link>
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((row) => (
            <JobCard key={row.id} row={row} />
          ))}
        </ul>
      )}
    </div>
  );
}
