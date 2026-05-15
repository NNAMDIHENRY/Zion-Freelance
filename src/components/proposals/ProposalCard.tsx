import type { ReactNode } from "react";

import Link from "next/link";

import { ProposalStatusBadge } from "@/components/proposals/ProposalStatusBadge";
import { moneyLabel } from "@/lib/projects/formatting";
import { cn } from "@/lib/utils";

import type { ProposalStatus } from "@prisma/client";

export type ProposalCardProps = {
  projectTitle: string;
  projectHref?: string;
  freelancerName?: string;
  proposedPrice: { toString(): string };
  currency: string;
  deliveryDays: number | null;
  status: ProposalStatus;
  submittedAt: Date | string;
  coverLetterPreview?: string;
  footer?: ReactNode;
  className?: string;
};

export function ProposalCard({
  projectTitle,
  projectHref,
  freelancerName,
  proposedPrice,
  currency,
  deliveryDays,
  status,
  submittedAt,
  coverLetterPreview,
  footer,
  className
}: ProposalCardProps) {
  const submitted =
    typeof submittedAt === "string" ? new Date(submittedAt) : submittedAt;

  const titleNode = projectHref ? (
    <Link href={projectHref} className="font-semibold text-foreground underline-offset-4 hover:underline">
      {projectTitle}
    </Link>
  ) : (
    <span className="font-semibold text-foreground">{projectTitle}</span>
  );

  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-subtle transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3 className="truncate text-base leading-tight">{titleNode}</h3>
          {freelancerName ? (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{freelancerName}</span>
            </p>
          ) : null}
        </div>
        <ProposalStatusBadge status={status} />
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Proposed price</dt>
          <dd className="mt-1 font-medium tabular-nums">{moneyLabel(proposedPrice, currency)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Delivery</dt>
          <dd className="mt-1 font-medium">
            {deliveryDays != null ? `${deliveryDays} day${deliveryDays === 1 ? "" : "s"}` : "—"}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Submitted</dt>
          <dd className="mt-1 text-muted-foreground tabular-nums">{submitted.toLocaleString()}</dd>
        </div>
      </dl>

      {coverLetterPreview ? (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cover letter</p>
          <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {coverLetterPreview}
          </p>
        </div>
      ) : null}

      {footer ? <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">{footer}</div> : null}
    </article>
  );
}
