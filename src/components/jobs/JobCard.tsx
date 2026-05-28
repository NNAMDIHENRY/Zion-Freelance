import Link from "next/link";
import { BadgeCheck, Clock, MapPin, Sparkles, Zap } from "lucide-react";

import {
  formatSalaryRange,
  labelEmploymentType,
  labelExperienceLevel,
  labelWorkMode,
  locationLabel
} from "@/lib/jobs/formatting";
import type { JobSearchRow } from "@/lib/jobs/search/types";
import { VerifiedBadge } from "@/components/ui/verified-badge";

export function JobCard({ row }: { row: JobSearchRow }) {
  return (
    <li className="group flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-subtle transition hover:border-primary/30 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {row.featured ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              <Sparkles className="h-3 w-3" /> Featured
            </span>
          ) : null}
          {row.urgentHiring ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
              <Zap className="h-3 w-3" /> Urgent
            </span>
          ) : null}
        </div>
        <h2 className="font-semibold text-foreground group-hover:text-primary">
          <Link href={`/jobs/${row.slug}`} className="hover:underline">
            {row.title}
          </Link>
        </h2>
        <p className="text-sm font-medium text-foreground/90">
          {row.companyName}
          {row.verifiedEmployerBadge ? (
            <span className="ml-2 inline-flex align-middle">
              <VerifiedBadge />
            </span>
          ) : null}
        </p>
        <p className="text-xs text-muted-foreground">
          {row.categoryName} · {labelEmploymentType(row.employmentType)} ·{" "}
          {labelExperienceLevel(row.experienceLevel)}
        </p>
        <p className="line-clamp-2 text-sm text-muted-foreground">{row.shortDescription}</p>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {locationLabel(row)}
          </span>
          <span>{labelWorkMode(row.workMode)}</span>
          {row.applicationDeadline ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Apply by {new Date(row.applicationDeadline).toLocaleDateString()}
            </span>
          ) : null}
        </div>
        {row.skills.length ? (
          <div className="flex flex-wrap gap-2">
            {row.skills.map((s) => (
              <span
                key={s}
                className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                {s}
              </span>
            ))}
          </div>
        ) : null}
        <p className="text-sm tabular-nums font-medium text-foreground">
          {formatSalaryRange({
            min: row.salaryMin,
            max: row.salaryMax,
            currency: row.currency,
            salaryType: row.salaryType
          })}
        </p>
      </div>
      <Link
        href={`/jobs/${row.slug}`}
        className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
      >
        View job
      </Link>
    </li>
  );
}
