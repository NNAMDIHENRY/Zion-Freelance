import Link from "next/link";
import type { ReactNode } from "react";

import type { getModerationQueue } from "@/lib/admin/payments/service";

export function ModerationQueuePanel({
  queue
}: {
  queue: Awaited<ReturnType<typeof getModerationQueue>>;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <QueueSection
        title="Flagged users"
        href="/admin/users"
        items={queue.flaggedUsers.map((u) => (
          <li key={u.id} className="text-sm">
            {u.name} <span className="text-muted-foreground">({u.email})</span>
          </li>
        ))}
      />
      <QueueSection
        title="Flagged projects"
        href="/admin/projects"
        items={queue.flaggedProjects.map((p) => (
          <li key={p.id} className="text-sm">
            {p.title} · {p.moderationStatus}
          </li>
        ))}
      />
      <QueueSection
        title="Open reports"
        href="/admin/reports"
        items={queue.openReports.map((r) => (
          <li key={r.id} className="text-sm">
            {r.category} · {r.severity}
          </li>
        ))}
      />
      <QueueSection
        title="Disputes"
        href="/admin/disputes"
        items={queue.openDisputes.map((d) => (
          <li key={d.id} className="text-sm">
            {d.status} — {d.reason.slice(0, 60)}
          </li>
        ))}
      />
      <QueueSection
        title="Withdrawals"
        href="/admin/withdrawals"
        className="lg:col-span-2"
        items={queue.pendingWithdrawals.map((w) => (
          <li key={w.id} className="text-sm">
            {w.amount.toString()} · {w.status}
            {w.flaggedForReview ? " · flagged" : ""}
          </li>
        ))}
      />
    </div>
  );
}

function QueueSection({
  title,
  href,
  items,
  className
}: {
  title: string;
  href: string;
  items: ReactNode[];
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-border/60 bg-card p-4 shadow-subtle ${className ?? ""}`}
    >
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Link href={href} className="text-xs text-primary hover:underline">
          View all
        </Link>
      </header>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Queue clear.</p>
      ) : (
        <ul className="space-y-2">{items}</ul>
      )}
    </section>
  );
}
