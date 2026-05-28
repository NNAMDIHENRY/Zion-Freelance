import { AbuseTargetType, ContractStatus, EscrowStatus, Role } from "@prisma/client";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ContractActions } from "@/components/contracts/ContractActions";
import { ContractReviewSection } from "@/components/reviews/ContractReviewSection";
import { ContractProgressTimeline } from "@/components/contracts/ContractProgressTimeline";
import { ContractSummaryCard } from "@/components/contracts/ContractSummaryCard";
import { EscrowTracker } from "@/components/contracts/EscrowTracker";
import { MilestoneAddForm } from "@/components/contracts/MilestoneAddForm";
import { MilestoneManager } from "@/components/contracts/MilestoneManager";
import { MilestoneProgress } from "@/components/contracts/MilestoneProgress";
import { MilestoneSetupPanel } from "@/components/contracts/MilestoneSetupPanel";
import { OpenDisputePanel } from "@/components/contracts/OpenDisputePanel";
import { ReportDialog } from "@/components/reports/ReportDialog";
import { getContractDispute } from "@/lib/contracts/disputes";
import { serializeContractDetail } from "@/lib/contracts/serialize";
import { getContractDetailForUser } from "@/lib/contracts/service";
import { getSession } from "@/lib/auth/session";
import { getWalletForUser } from "@/lib/payments/service";

export default async function ContractDetailPage({
  params
}: {
  params: Promise<{ contractId: string }>;
}) {
  const { contractId } = await params;
  const session = await getSession();
  if (!session?.user) redirect("/auth/login");

  if (session.user.role !== Role.CLIENT && session.user.role !== Role.FREELANCER) {
    notFound();
  }

  const res = await getContractDetailForUser(session.user.id, session.user.role, contractId);
  if (!res.ok) notFound();

  const contract = serializeContractDetail(res.data.row, res.data.viewerRole);
  const dispute = await getContractDispute(contractId);
  const escrowFunded =
    contract.escrow != null &&
    contract.escrow.status !== EscrowStatus.AWAITING_FUNDING &&
    Number(contract.escrow.fundedAmount) > 0;

  let walletAvailable = 0;
  if (session.user.role === Role.CLIENT) {
    const walletRes = await getWalletForUser(session.user.id);
    walletAvailable = walletRes.snapshot.available;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/contracts" className="text-primary underline-offset-4 hover:underline">
            Contracts
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{contract.project.title}</span>
        </p>
      </div>

      <ContractSummaryCard contract={contract} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-subtle">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Milestones
            </h2>
            <div className="mt-4">
              <MilestoneProgress
                milestones={contract.milestones}
                completionPercent={contract.completionPercent}
              />
              <MilestoneSetupPanel
                contractId={contract.id}
                contractStatus={contract.status}
                viewerRole={contract.viewerRole}
                agreedAmount={Number(contract.agreedAmount)}
                currency={contract.currency}
                hasMilestones={
                  contract.milestones.length > 1 ||
                  (contract.milestones[0]?.title !== "Project delivery" &&
                    contract.milestones.length > 0)
                }
              />
              <MilestoneAddForm
                contractId={contract.id}
                contractStatus={contract.status}
                agreedAmount={Number(contract.agreedAmount)}
                currency={contract.currency}
                milestones={contract.milestones}
                escrowFunded={escrowFunded}
              />
              <MilestoneManager
                contractId={contract.id}
                contractStatus={contract.status}
                viewerRole={contract.viewerRole}
                milestones={contract.milestones}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-subtle">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Actions
            </h2>
            <div className="mt-4 space-y-4">
              <OpenDisputePanel
                contractId={contract.id}
                contractStatus={contract.status}
                dispute={
                  dispute
                    ? {
                        id: dispute.id,
                        status: dispute.status,
                        reason: dispute.reason,
                        resolution: dispute.resolution,
                        createdAt: dispute.createdAt.toISOString(),
                        openedByName: dispute.openedBy.name
                      }
                    : null
                }
              />
              <ReportDialog
                targetType={AbuseTargetType.USER}
                targetId={
                  contract.viewerRole === "client"
                    ? contract.freelancer.userId
                    : contract.client.userId
                }
                label="Report user"
              />
              <ContractActions
                contractId={contract.id}
                status={contract.status}
                viewerRole={contract.viewerRole}
                escrowStatus={contract.escrow?.status ?? null}
                currency={contract.currency}
                escrowRemaining={Number(contract.escrow?.pendingAmount ?? 0)}
                walletAvailable={walletAvailable}
              />
            </div>
          </div>

          {contract.escrow ? (
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-subtle">
              <EscrowTracker
                total={contract.agreedAmount}
                funded={contract.escrow.fundedAmount}
                released={contract.escrow.releasedAmount}
                pending={contract.escrow.pendingAmount}
                held={contract.escrow.heldAmount}
                currency={contract.escrow.currency}
                status={contract.escrow.status}
              />
            </div>
          ) : null}

          <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-subtle">
            <ContractProgressTimeline
              status={contract.status}
              acceptedAt={contract.acceptedAt}
              completedAt={contract.completedAt}
              escrowFunded={escrowFunded}
              completionPercent={contract.completionPercent}
            />
          </section>

          {contract.status === ContractStatus.COMPLETED ? (
            <ContractReviewSection
              contractId={contract.id}
              userId={session.user.id}
              role={session.user.role}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
