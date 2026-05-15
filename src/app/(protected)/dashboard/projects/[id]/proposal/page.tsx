import { ProposalStatus, Role } from "@prisma/client";
import Link from "next/link";
import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";

import { ProposalForm } from "@/components/proposals/ProposalForm";
import { getSession } from "@/lib/auth/session";
import { budgetLabel } from "@/lib/projects/formatting";
import {
  getFreelancerProposalContentForProject,
  getOpenProjectForFreelancerProposal
} from "@/lib/proposals/service";

export default async function FreelancerProjectProposalPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) return null;

  if (session.user.role !== Role.FREELANCER) {
    redirect("/dashboard");
  }

  const projectRes = await getOpenProjectForFreelancerProposal(id, session.user.id);
  if (!projectRes.ok) {
    if (projectRes.code === "NOT_FOUND") notFound();
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <p className="font-medium text-destructive">{projectRes.error}</p>
        <p className="mt-4 text-sm text-muted-foreground">
          <Link href="/freelancer/jobs" className="text-primary underline-offset-4 hover:underline">
            Back to open projects
          </Link>
        </p>
      </div>
    );
  }

  const project = projectRes.data;
  const proposalRes = await getFreelancerProposalContentForProject(
    session.user.id,
    session.user.role,
    id
  );
  const existing = proposalRes.ok ? proposalRes.data : null;

  let form: ReactNode;
  if (existing?.status === ProposalStatus.REVIEWED) {
    form = (
      <ProposalForm
        projectId={id}
        currency={existing.currency}
        mode="edit"
        proposalId={existing.id}
        lockedReason="This proposal is under client review and can no longer be edited."
      />
    );
  } else if (existing?.status === ProposalStatus.ACCEPTED) {
    form = (
      <ProposalForm
        projectId={id}
        currency={existing.currency}
        mode="create"
        lockedReason="Your proposal was accepted. Continue from your proposals dashboard."
        proposalId={existing.id}
      />
    );
  } else if (existing?.status === ProposalStatus.PENDING) {
    form = (
      <ProposalForm
        projectId={id}
        currency={existing.currency}
        mode="edit"
        proposalId={existing.id}
        initial={{
          proposedPrice: Number(existing.proposedPrice),
          coverLetter: existing.coverLetter,
          deliveryDays: existing.deliveryDays ?? 14
        }}
      />
    );
  } else {
    form = (
      <ProposalForm
        projectId={id}
        currency={project.currency}
        mode="create"
        initial={
          existing &&
          (existing.status === ProposalStatus.REJECTED ||
            existing.status === ProposalStatus.WITHDRAWN)
            ? {
                proposedPrice: Number(existing.proposedPrice),
                coverLetter: existing.coverLetter,
                deliveryDays: existing.deliveryDays ?? 14
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          <Link href="/freelancer/jobs" className="text-primary underline-offset-4 hover:underline">
            Open projects
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Submit proposal</span>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{project.title}</h1>
        <p className="text-sm text-muted-foreground">
          Budget {budgetLabel(project.budgetMin, project.budgetMax, project.currency)}
          {project.deadline ? ` · Deadline ${project.deadline.toLocaleDateString()}` : ""}
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-subtle">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Brief</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{project.description}</p>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Your proposal</h2>
        {form}
      </div>
    </div>
  );
}
