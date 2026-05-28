import type { NotificationType } from "@prisma/client";

export type NotificationEntityRef = {
  proposalId?: string;
  contractId?: string;
  milestoneId?: string;
  projectId?: string;
  jobId?: string;
  applicationId?: string;
  conversationId?: string;
  transactionId?: string;
  paymentId?: string;
  reviewId?: string;
};

export function parseEntityRef(data: unknown): NotificationEntityRef {
  if (!data || typeof data !== "object") return {};
  const o = data as Record<string, unknown>;
  const pick = (k: keyof NotificationEntityRef) =>
    typeof o[k] === "string" ? (o[k] as string) : undefined;
  return {
    proposalId: pick("proposalId"),
    contractId: pick("contractId"),
    milestoneId: pick("milestoneId"),
    projectId: pick("projectId"),
    jobId: pick("jobId"),
    applicationId: pick("applicationId"),
    conversationId: pick("conversationId"),
    transactionId: pick("transactionId"),
    paymentId: pick("paymentId"),
    reviewId: pick("reviewId")
  };
}

/** Deep-link href for dashboard navigation. */
export function resolveNotificationHref(
  type: NotificationType,
  data: unknown
): string | null {
  const ref = parseEntityRef(data);

  if (type === "MESSAGE" && ref.conversationId) {
    return `/dashboard/messages?conversation=${encodeURIComponent(ref.conversationId)}`;
  }
  if (ref.proposalId) {
    return `/dashboard/proposals/${ref.proposalId}`;
  }
  if (ref.contractId) {
    const base = `/dashboard/contracts/${ref.contractId}`;
    if (ref.milestoneId) return `${base}#milestone-${ref.milestoneId}`;
    return base;
  }
  if (ref.projectId) {
    return `/dashboard/projects/${ref.projectId}`;
  }
  if (type === "JOB" || ref.jobId || ref.applicationId) {
    if (ref.jobId && ref.applicationId) {
      return `/dashboard/jobs/${ref.jobId}/applications?highlight=${encodeURIComponent(ref.applicationId)}`;
    }
    if (ref.applicationId) {
      return `/dashboard/jobs/applications?highlight=${encodeURIComponent(ref.applicationId)}`;
    }
    if (ref.jobId) {
      return `/dashboard/jobs/${ref.jobId}/applications`;
    }
  }
  if (type === "WITHDRAWAL") return "/freelancer/earnings";
  if (type === "PAYMENT" || type === "ESCROW") return "/client/payments";
  return "/dashboard/notifications";
}
