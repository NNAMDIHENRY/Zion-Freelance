import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JobStatus } from "@prisma/client";
import { MapPin, Building2, Eye, Users } from "lucide-react";

import { JobApplicationForm } from "@/components/jobs/JobApplicationForm";
import { JobCard } from "@/components/jobs/JobCard";
import { JobViewTracker } from "@/components/jobs/JobViewTracker";
import { SaveJobButton } from "@/components/jobs/SaveJobButton";
import { ReportDialog } from "@/components/reports/ReportDialog";
import { AbuseTargetType } from "@prisma/client";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { getSession } from "@/lib/auth/session";
import {
  formatSalaryRange,
  labelEmploymentType,
  labelExperienceLevel,
  labelWorkMode,
  locationLabel
} from "@/lib/jobs/formatting";
import { getRelatedJobs } from "@/lib/jobs/search/service";
import { getJobBySlug, isJobSaved } from "@/lib/jobs/service";
import { prisma } from "@/lib/db";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const job = await prisma.job.findUnique({
    where: { slug },
    select: { title: true, shortDescription: true, status: true, companyName: true }
  });
  if (!job || job.status !== JobStatus.ACTIVE) {
    return { title: "Job not found" };
  }
  const base = (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return {
    title: `${job.title} at ${job.companyName} | Zion TeCHer`,
    description: job.shortDescription,
    openGraph: {
      title: job.title,
      description: job.shortDescription,
      type: "website",
      url: `${base}/jobs/${slug}`
    },
    twitter: { card: "summary_large_image", title: job.title, description: job.shortDescription },
    alternates: { canonical: `${base}/jobs/${slug}` }
  };
}

export default async function JobDetailPage({ params }: Props) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job || job.status !== JobStatus.ACTIVE) notFound();

  const session = await getSession();
  const saved = session?.user?.id ? await isJobSaved(session.user.id, job.id) : false;
  const related = await getRelatedJobs(job.id, job.categoryId, 4);

  const isOwner = session?.user?.id === job.posterId;
  const hasApplied = session?.user?.id
    ? await prisma.jobApplication.findFirst({
        where: {
          jobId: job.id,
          applicantId: session.user.id,
          status: { not: "WITHDRAWN" }
        },
        select: { id: true }
      })
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.shortDescription,
    datePosted: job.publishedAt?.toISOString(),
    validThrough: job.applicationDeadline?.toISOString(),
    hiringOrganization: { "@type": "Organization", name: job.companyName },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.city,
        addressRegion: job.stateProvince,
        addressCountry: job.country
      }
    },
    employmentType: job.employmentType
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <JobViewTracker jobId={job.id} />
      <article className="mx-auto max-w-5xl space-y-10 px-4 py-10 sm:px-6">
        <header className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-lg text-muted-foreground">
                <Building2 className="h-5 w-5" />
                {job.companyName}
                {job.verifiedEmployerBadge ? <VerifiedBadge /> : null}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {session?.user ? <SaveJobButton jobId={job.id} initialSaved={saved} /> : null}
              {session?.user ? (
                <ReportDialog targetType={AbuseTargetType.JOB} targetId={job.id} label="Report" />
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {locationLabel(job)} · {labelWorkMode(job.workMode)}
            </span>
            <span>{labelEmploymentType(job.employmentType)}</span>
            <span>{labelExperienceLevel(job.experienceLevel)}</span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-4 w-4" /> {job.viewCount} views
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-4 w-4" /> {job.applicationCount} applications
            </span>
          </div>
          <p className="text-lg font-medium">
            {formatSalaryRange({
              min: job.salaryMin?.toString() ?? null,
              max: job.salaryMax?.toString() ?? null,
              currency: job.currency,
              salaryType: job.salaryType
            })}
          </p>
          {job.skills.length ? (
            <div className="flex flex-wrap gap-2">
              {job.skills.map((s) => (
                <span
                  key={s.skillId}
                  className="rounded-full bg-muted px-3 py-1 text-xs font-medium"
                >
                  {s.skill.name}
                </span>
              ))}
            </div>
          ) : null}
        </header>

        <div className="grid gap-10 lg:grid-cols-3">
          <div className="prose prose-neutral dark:prose-invert lg:col-span-2 max-w-none">
            <section>
              <h2 className="text-xl font-semibold">About the role</h2>
              <div className="mt-3 whitespace-pre-wrap text-muted-foreground">
                {job.fullDescription}
              </div>
            </section>
            {job.requirements ? (
              <section className="mt-8">
                <h2 className="text-xl font-semibold">Requirements</h2>
                <div className="mt-3 whitespace-pre-wrap text-muted-foreground">
                  {job.requirements}
                </div>
              </section>
            ) : null}
            {job.benefits ? (
              <section className="mt-8">
                <h2 className="text-xl font-semibold">Benefits</h2>
                <div className="mt-3 whitespace-pre-wrap text-muted-foreground">
                  {job.benefits}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-subtle">
              <h2 className="text-lg font-semibold">Apply for this job</h2>
              {isOwner ? (
                <p className="mt-2 text-sm text-muted-foreground">This is your job posting.</p>
              ) : !session?.user ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  <Link href="/auth/login" className="text-primary underline">
                    Sign in
                  </Link>{" "}
                  to apply.
                </p>
              ) : hasApplied ? (
                <p className="mt-4 text-sm text-emerald-700 dark:text-emerald-400">
                  You have already applied.{" "}
                  <Link href="/dashboard/jobs/applications" className="underline">
                    Track application
                  </Link>
                </p>
              ) : (
                <div className="mt-4">
                  <JobApplicationForm
                    jobId={job.id}
                    defaultName={session.user.name ?? undefined}
                    defaultEmail={session.user.email ?? undefined}
                  />
                </div>
              )}
            </div>
            {job.applicationUrl ? (
              <a
                href={job.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-sm text-primary underline"
              >
                External application link
              </a>
            ) : null}
          </aside>
        </div>

        {related.length > 0 ? (
          <section>
            <h2 className="mb-4 text-xl font-semibold">Related jobs</h2>
            <ul className="space-y-4">
              {related.map((row) => (
                <JobCard key={row.id} row={row} />
              ))}
            </ul>
          </section>
        ) : null}
      </article>
    </>
  );
}
