import { ContractStatusBadge } from "@/components/contracts/ContractStatusBadge";
import type { ContractDetailDTO } from "@/components/contracts/types";
import { moneyLabel, statusLabel } from "@/lib/projects/formatting";

export function ContractSummaryCard({ contract }: { contract: ContractDetailDTO }) {
  const counterparty =
    contract.viewerRole === "client" ? contract.freelancer : contract.client;

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-subtle space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{contract.project.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            With <span className="font-medium text-foreground">{counterparty.name}</span>
          </p>
        </div>
        <ContractStatusBadge status={contract.status} />
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">Agreed amount</dt>
          <dd className="mt-1 font-medium tabular-nums">
            {moneyLabel(contract.agreedAmount, contract.currency)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Delivery</dt>
          <dd className="mt-1 font-medium">
            {contract.deliveryDays != null
              ? `${contract.deliveryDays} day${contract.deliveryDays === 1 ? "" : "s"}`
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Project status</dt>
          <dd className="mt-1 font-medium">{statusLabel(contract.project.status)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Created</dt>
          <dd className="mt-1 font-medium">{new Date(contract.createdAt).toLocaleDateString()}</dd>
        </div>
      </dl>
      {contract.deliveryTerms ? (
        <div className="border-t border-border/60 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Delivery terms
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground line-clamp-4">
            {contract.deliveryTerms}
          </p>
        </div>
      ) : null}
    </div>
  );
}
