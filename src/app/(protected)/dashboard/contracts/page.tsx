import { Role } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ContractStatusBadge } from "@/components/contracts/ContractStatusBadge";
import { serializeContractListItem } from "@/lib/contracts/serialize";
import { listContractsForUser } from "@/lib/contracts/service";
import { getSession } from "@/lib/auth/session";
import { moneyLabel, statusLabel } from "@/lib/projects/formatting";

export default async function ContractsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/auth/login");

  if (session.user.role !== Role.CLIENT && session.user.role !== Role.FREELANCER) {
    redirect("/dashboard");
  }

  const res = await listContractsForUser(session.user.id, session.user.role);
  if (!res.ok) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
        {res.error}
      </div>
    );
  }

  const items = res.data.map(serializeContractListItem);
  const isClient = session.user.role === Role.CLIENT;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contracts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isClient
            ? "Manage agreements, escrow funding, and milestone releases."
            : "Track active agreements, submit work, and monitor payments."}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/10 p-10 text-center text-sm text-muted-foreground">
          No contracts yet. Contracts are created when a client accepts a proposal.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((c) => (
            <li key={c.id}>
              <Link
                href={`/dashboard/contracts/${c.id}`}
                className="block rounded-2xl border border-border/60 bg-card p-5 shadow-subtle transition-colors hover:bg-muted/20"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium text-foreground">{c.projectTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      {isClient ? c.freelancerName : "Your contract"} ·{" "}
                      {moneyLabel(c.agreedAmount, c.currency)}
                    </p>
                  </div>
                  <ContractStatusBadge status={c.status} />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span>{c.milestoneCount} milestone{c.milestoneCount === 1 ? "" : "s"}</span>
                  <span>{c.completionPercent}% complete</span>
                  {c.escrowStatus ? <span>Escrow: {statusLabel(c.escrowStatus)}</span> : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
