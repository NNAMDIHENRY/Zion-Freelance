import "server-only";

import { NotificationPriority, NotificationType, type Prisma } from "@prisma/client";

import { emitWorkflowNotification } from "@/lib/notifications/dispatch";

export async function notifyProposalSubmitted(params: {
  clientUserId: string;
  projectId: string;
  projectTitle: string;
  proposalId: string;
  freelancerName: string;
}) {
  await emitWorkflowNotification("proposal.submitted", {
    userId: params.clientUserId,
    type: NotificationType.PROPOSAL,
    title: "New proposal received",
    body: `${params.freelancerName} submitted a proposal on "${params.projectTitle}".`,
    priority: NotificationPriority.NORMAL,
    data: {
      proposalId: params.proposalId,
      projectId: params.projectId
    } satisfies Prisma.JsonObject,
    emailCtaLabel: "Review proposal"
  });
}

export async function notifyProposalAccepted(params: {
  freelancerUserId: string;
  proposalId: string;
  contractId: string;
  projectTitle: string;
}) {
  await emitWorkflowNotification("proposal.accepted", {
    userId: params.freelancerUserId,
    type: NotificationType.PROPOSAL,
    title: "Proposal accepted",
    body: `Your proposal for "${params.projectTitle}" was accepted. A contract is ready.`,
    priority: NotificationPriority.HIGH,
    data: {
      proposalId: params.proposalId,
      contractId: params.contractId
    } satisfies Prisma.JsonObject,
    emailCtaLabel: "View contract"
  });
}

export async function notifyProposalRejected(params: {
  freelancerUserId: string;
  proposalId: string;
  projectTitle: string;
}) {
  await emitWorkflowNotification("proposal.rejected", {
    userId: params.freelancerUserId,
    type: NotificationType.PROPOSAL,
    title: "Proposal not selected",
    body: `Your proposal for "${params.projectTitle}" was not selected.`,
    priority: NotificationPriority.NORMAL,
    data: { proposalId: params.proposalId } satisfies Prisma.JsonObject
  });
}

export async function notifyContractAccepted(params: {
  clientUserId: string;
  contractId: string;
  freelancerName: string;
}) {
  await emitWorkflowNotification("contract.accepted", {
    userId: params.clientUserId,
    type: NotificationType.CONTRACT,
    title: "Contract accepted",
    body: `${params.freelancerName} accepted the contract. You can fund escrow when ready.`,
    priority: NotificationPriority.HIGH,
    data: { contractId: params.contractId } satisfies Prisma.JsonObject,
    emailCtaLabel: "Open contract"
  });
}

export async function notifyMilestoneSubmitted(params: {
  clientUserId: string;
  contractId: string;
  milestoneId: string;
  milestoneTitle: string;
}) {
  await emitWorkflowNotification("milestone.submitted", {
    userId: params.clientUserId,
    type: NotificationType.MILESTONE,
    title: "Milestone work submitted",
    body: `"${params.milestoneTitle}" is ready for your review.`,
    priority: NotificationPriority.HIGH,
    data: {
      contractId: params.contractId,
      milestoneId: params.milestoneId
    } satisfies Prisma.JsonObject,
    emailCtaLabel: "Review milestone"
  });
}

export async function notifyMilestoneApproved(params: {
  freelancerUserId: string;
  contractId: string;
  milestoneId: string;
  milestoneTitle: string;
}) {
  await emitWorkflowNotification("milestone.approved", {
    userId: params.freelancerUserId,
    type: NotificationType.MILESTONE,
    title: "Milestone approved",
    body: `"${params.milestoneTitle}" was approved by the client.`,
    priority: NotificationPriority.NORMAL,
    data: {
      contractId: params.contractId,
      milestoneId: params.milestoneId
    } satisfies Prisma.JsonObject
  });
}

export async function notifyMilestoneReleased(params: {
  userId: string;
  contractId: string;
  milestoneId: string;
  milestoneTitle: string;
  amountLabel: string;
}) {
  await emitWorkflowNotification("milestone.released", {
    userId: params.userId,
    type: NotificationType.PAYMENT,
    title: "Milestone payment released",
    body: `${params.amountLabel} was released for "${params.milestoneTitle}".`,
    priority: NotificationPriority.HIGH,
    data: {
      contractId: params.contractId,
      milestoneId: params.milestoneId
    } satisfies Prisma.JsonObject,
    emailCtaLabel: "View contract"
  });
}

export async function notifyContractCompleted(params: {
  userId: string;
  contractId: string;
  projectTitle: string;
}) {
  await emitWorkflowNotification("contract.completed", {
    userId: params.userId,
    type: NotificationType.CONTRACT,
    title: "Contract completed",
    body: `The contract for "${params.projectTitle}" is now complete.`,
    priority: NotificationPriority.NORMAL,
    data: { contractId: params.contractId } satisfies Prisma.JsonObject
  });
}

export async function notifySecurityLogin(params: {
  userId: string;
  ipHint?: string;
}) {
  await emitWorkflowNotification("security.login", {
    userId: params.userId,
    type: NotificationType.SECURITY,
    title: "New sign-in",
    body: params.ipHint
      ? `Your account was used to sign in (${params.ipHint}).`
      : "Your account was used to sign in.",
    priority: NotificationPriority.NORMAL,
    data: {} satisfies Prisma.JsonObject,
    skipEmail: false
  });
}
