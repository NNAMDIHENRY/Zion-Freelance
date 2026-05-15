import { Role } from "@prisma/client";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ClientProjectProposalsTable } from "@/components/proposals/ClientProjectProposalsTable";
import { ProposalActions } from "@/components/proposals/ProposalActions";
import { getSession } from "@/lib/auth/session";
import { getClientProfileIdForUser, getProjectOwnedByClient } from "@/lib/projects/service";
import { listProjectProposals } from "@/lib/proposals/service";
import { serializeClientProposalRow } from "@/lib/proposals/serialize";

export default async function ClientProjectProposalsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) return null;

  if (session.user.role !== Role.CLIENT) {
    redirect("/dashboard");
  }

  const clientId = await getClientProfileIdForUser(session.user.id);
  if (!clientId) return null;

  const project = await getProjectOwnedByClient(id, clientId);
  if (!project) notFound();

  const list = await listProjectProposals(session.user.id, session.user.role, id);
  const rows = list.ok ? list.data.map(serializeClientProposalRow) : [];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          <Link href={`/dashboard/projects/${id}`} className="text-primary underline-offset-4 hover:underline">
            {project.title}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Proposals</span>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Proposal inbox</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Review cover letters, compare pricing, and accept the freelancer you want to move forward with.
        </p>
      </div>

      <ClientProjectProposalsTable
        rows={rows}
        proposalDetailHref={(proposalId) => `/dashboard/proposals/${proposalId}`}
        actions={(row) => (
          <ProposalActions proposalId={row.id} status={row.status} role="client" />
        )}
      />
    </div>
  );
}
