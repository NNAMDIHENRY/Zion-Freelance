import { Role } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProposalActions } from "@/components/proposals/ProposalActions";
import { ProposalStatusBadge } from "@/components/proposals/ProposalStatusBadge";
import { ProposalTimelineDisplay } from "@/components/proposals/ProposalTimelineDisplay";
import { getSession } from "@/lib/auth/session";
import { moneyLabel, statusLabel } from "@/lib/projects/formatting";
import { getProposalDetailForUser } from "@/lib/proposals/service";

export default async function ProposalDetailPage({
  params
}: {
  params: Promise<{ proposalId: string }>;
}) {
  const { proposalId } = await params;
  const session = await getSession();
  if (!session?.user) return null;

  if (session.user.role !== Role.CLIENT && session.user.role !== Role.FREELANCER) {
    notFound();
  }

  const res = await getProposalDetailForUser(session.user.id, session.user.role, proposalId);
  if (!res.ok) notFound();

  const p = res.data;
  const isClient = session.user.role === Role.CLIENT;
  const projectHref = `/dashboard/projects/${p.projectId}`;
  const proposalsHref = `/dashboard/projects/${p.projectId}/proposals`;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {isClient ? (
            <>
              <Link href={projectHref} className="text-primary underline-offset-4 hover:underline">
                {p.project.title}
              </Link>
              <span className="mx-2">/</span>
              <Link href={proposalsHref} className="text-primary underline-offset-4 hover:underline">
                Proposals
              </Link>
            </>
          ) : (
            <Link href="/dashboard/proposals" className="text-primary underline-offset-4 hover:underline">
              My proposals
            </Link>
          )}
          <span className="mx-2">/</span>
          <span className="text-foreground">Detail</span>
        </p>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{p.project.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isClient ? (
                <>
                  From{" "}
                  <span className="font-medium text-foreground">
                    {p.freelancer.user.name ?? p.freelancer.user.email}
                  </span>
                </>
              ) : (
                <>Submitted to client project</>
              )}
            </p>
          </div>
          <ProposalStatusBadge status={p.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-subtle">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Cover letter</h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{p.coverLetter}</p>
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-subtle">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Price</dt>
                <dd className="mt-1 font-medium tabular-nums">
                  {moneyLabel(p.proposedPrice, p.currency)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Delivery</dt>
                <dd className="mt-1 font-medium">
                  {p.deliveryDays != null ? `${p.deliveryDays} day${p.deliveryDays === 1 ? "" : "s"}` : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Project status</dt>
                <dd className="mt-1 font-medium">{statusLabel(p.project.status)}</dd>
              </div>
              {p.contract ? (
                <div>
                  <dt className="text-xs text-muted-foreground">Contract</dt>
                  <dd className="mt-1 font-medium">{statusLabel(p.contract.status)}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-subtle">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Status timeline</h2>
            <div className="mt-4">
              <ProposalTimelineDisplay
                createdAt={p.createdAt}
                updatedAt={p.updatedAt}
                withdrawnAt={p.withdrawnAt}
                status={p.status}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-subtle">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Actions</h2>
            <div className="mt-4">
              <ProposalActions
                proposalId={p.id}
                status={p.status}
                role={isClient ? "client" : "freelancer"}
                layout="stack"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
