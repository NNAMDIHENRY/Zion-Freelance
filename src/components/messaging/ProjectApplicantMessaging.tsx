import { Role } from "@prisma/client";

import { OpenConversationButton } from "@/components/messaging/OpenConversationButton";
import { getSession } from "@/lib/auth/session";
import { listProjectProposals } from "@/lib/proposals/service";

export async function ProjectApplicantMessaging({ projectId }: { projectId: string }) {
  const session = await getSession();

  if (!session?.user || session.user.role !== Role.CLIENT) return null;

  const list = await listProjectProposals(session.user.id, Role.CLIENT, projectId);

  if (!list.ok || list.data.length === 0) return null;

  const slice = list.data.slice(0, 14);

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-subtle">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Messaging entry points
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Jump into the secured proposal thread—existing lanes reopen automatically with zero duplicates.
          </p>
        </div>
      </div>

      <ul className="mt-4 divide-y divide-border/60">
        {slice.map((proposal) => (
          <li key={proposal.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {proposal.freelancer.user.name ?? proposal.freelancer.user.email}
              </p>
              <p className="text-xs text-muted-foreground">{proposal.status}</p>
            </div>

            <OpenConversationButton mode="proposal" proposalId={proposal.id} label="Message" variant="outline" />
          </li>
        ))}
      </ul>
    </div>
  );
}
