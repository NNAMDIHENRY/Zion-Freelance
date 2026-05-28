import Link from "next/link";

import { OpenConversationButton } from "@/components/messaging/OpenConversationButton";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import type { FreelancerSearchRow } from "@/lib/search/types";

export function FreelancerResultCard({ row }: { row: FreelancerSearchRow }) {
  return (
    <li className="rounded-2xl border border-border/60 bg-card p-5 shadow-subtle">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 className="flex flex-wrap items-center gap-2 font-semibold text-foreground">
            {row.name}
            {row.verified ? <VerifiedBadge /> : null}
            {row.planTier && row.planTier !== "FREE" ? (
              <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-violet-700 dark:text-violet-300">
                {row.planTier}
              </span>
            ) : null}
          </h2>
          {row.headline ? (
            <p className="text-sm text-muted-foreground">{row.headline}</p>
          ) : null}
        </div>
        <div className="text-right text-sm tabular-nums">
          <p className="font-medium text-foreground">★ {row.ratingAverage}</p>
          <p className="text-xs text-muted-foreground">{row.ratingCount} reviews</p>
          {row.hourlyRate ? (
            <p className="mt-1 text-xs text-muted-foreground">USD {row.hourlyRate}/hr</p>
          ) : null}
        </div>
      </div>
      {row.bioPreview ? (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{row.bioPreview}</p>
      ) : null}
      {row.skills.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
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
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link
          href={`/users/${row.userId}`}
          className="inline-flex text-sm font-medium text-primary hover:underline"
        >
          View profile
        </Link>

        <OpenConversationButton
          mode="client-directory"
          freelancerUserId={row.userId}
          variant="outline"
          size="sm"
          label="Message freelancer"
        />
      </div>
    </li>
  );
}
