import { Role } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

import { FreelancerProposalsTable } from "@/components/proposals/ProposalTable";
import { getSession } from "@/lib/auth/session";
import { listFreelancerProposals } from "@/lib/proposals/service";
import { serializeFreelancerProposalRow } from "@/lib/proposals/serialize";

export default async function DashboardProposalsPage() {
  const session = await getSession();

  if (!session?.user) {
    return null;
  }

  if (session.user.role !== Role.FREELANCER) {
    redirect("/dashboard");
  }

  const list = await listFreelancerProposals(
    session.user.id,
    session.user.role
  );

  const rows = list.ok
    ? list.data.map(serializeFreelancerProposalRow)
    : [];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          My Proposals
        </h1>

        <p className="max-w-2xl text-sm text-muted-foreground">
          Track every bid you have placed, follow client decisions,
          and withdraw when plans change.
        </p>
      </div>

      <FreelancerProposalsTable
        rows={rows}
        emptyMessage="You have not submitted any proposals yet. Browse open projects to get started."
      />

      <p className="text-sm text-muted-foreground">
        Looking for work?{" "}
        <Link
          href="/freelancer/jobs"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Browse open projects
        </Link>
      </p>
    </div>
  );
}