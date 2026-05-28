import type { EscrowStatus } from "@prisma/client";

import { moneyLabel, statusLabel } from "@/lib/projects/formatting";
import { cn } from "@/lib/utils";

type EscrowTrackerProps = {
  total: string;
  funded: string;
  released: string;
  pending: string;
  held: string;
  currency: string;
  status: EscrowStatus;
};

export function EscrowTracker({
  total,
  funded,
  released,
  pending,
  held,
  currency,
  status
}: EscrowTrackerProps) {
  const t = Number(total) || 1;
  const fundedPct = Math.min(100, Math.round((Number(funded) / t) * 100));
  const releasedPct = Math.min(100, Math.round((Number(released) / t) * 100));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Escrow</h3>
        <span className="rounded-full bg-muted/80 px-2 py-0.5 text-xs font-medium">
          {statusLabel(status)}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Funded</span>
          <span className="tabular-nums">{fundedPct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full bg-sky-500 transition-all")}
            style={{ width: `${fundedPct}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Released</span>
          <span className="tabular-nums">{releasedPct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full bg-emerald-500 transition-all")}
            style={{ width: `${releasedPct}%` }}
          />
        </div>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">Contract value</dt>
          <dd className="mt-1 font-medium tabular-nums">{moneyLabel(total, currency)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Funded</dt>
          <dd className="mt-1 font-medium tabular-nums">{moneyLabel(funded, currency)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Released</dt>
          <dd className="mt-1 font-medium tabular-nums">{moneyLabel(released, currency)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Held in escrow</dt>
          <dd className="mt-1 font-medium tabular-nums">{moneyLabel(held, currency)}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs text-muted-foreground">Awaiting funding</dt>
          <dd className="mt-1 font-medium tabular-nums">{moneyLabel(pending, currency)}</dd>
        </div>
      </dl>
    </div>
  );
}
