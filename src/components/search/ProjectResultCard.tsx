import Link from "next/link";

import type { ProjectSearchRow } from "@/lib/search/types";

export function ProjectResultCard({
  row,
  proposalHref
}: {
  row: ProjectSearchRow;
  proposalHref?: string;
}) {
  const cta = proposalHref ?? `/projects/${row.id}`;

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-subtle sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-2">
        <h2 className="font-semibold text-foreground">{row.title}</h2>
        <p className="text-xs text-muted-foreground">
          {row.category ?? "Uncategorized"}
          {row.deadline
            ? ` · Deadline ${new Date(row.deadline).toLocaleDateString()}`
            : ""}
        </p>
        <p className="text-sm text-muted-foreground">{row.descriptionPreview}</p>
        {row.skillNames.length ? (
          <div className="flex flex-wrap gap-2">
            {row.skillNames.map((s) => (
              <span
                key={s}
                className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                {s}
              </span>
            ))}
          </div>
        ) : null}
        <p className="text-sm tabular-nums text-muted-foreground">{row.budgetLabel}</p>
      </div>
      <Link
        href={cta}
        className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
      >
        {proposalHref ? "Submit proposal" : "View project"}
      </Link>
    </li>
  );
}
