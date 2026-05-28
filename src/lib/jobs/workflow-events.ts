import "server-only";

import { NotificationPriority, NotificationType, type Prisma } from "@prisma/client";

import { emitWorkflowNotification } from "@/lib/notifications/dispatch";

export async function notifyJobApplicationSubmitted(params: {
  posterUserId: string;
  jobId: string;
  jobTitle: string;
  applicationId: string;
  applicantName: string;
}) {
  await emitWorkflowNotification("job.application.submitted", {
    userId: params.posterUserId,
    type: NotificationType.JOB,
    title: "New job application",
    body: `${params.applicantName} applied to "${params.jobTitle}".`,
    priority: NotificationPriority.NORMAL,
    data: { jobId: params.jobId, applicationId: params.applicationId } satisfies Prisma.JsonObject,
    emailCtaLabel: "Review applications"
  });
}

export async function notifyJobApplicationStatus(params: {
  applicantUserId: string;
  jobTitle: string;
  applicationId: string;
  statusLabel: string;
}) {
  await emitWorkflowNotification("job.application.status", {
    userId: params.applicantUserId,
    type: NotificationType.JOB,
    title: "Application update",
    body: `Your application for "${params.jobTitle}" is now: ${params.statusLabel}.`,
    priority: NotificationPriority.NORMAL,
    data: { applicationId: params.applicationId } satisfies Prisma.JsonObject
  });
}

export async function notifyJobModeration(params: {
  posterUserId: string;
  jobId: string;
  jobTitle: string;
  approved: boolean;
  note?: string;
}) {
  await emitWorkflowNotification("job.moderation", {
    userId: params.posterUserId,
    type: NotificationType.JOB,
    title: params.approved ? "Job approved" : "Job not approved",
    body: params.approved
      ? `"${params.jobTitle}" is now live on the job board.`
      : `"${params.jobTitle}" was not approved.${params.note ? ` Note: ${params.note}` : ""}`,
    priority: NotificationPriority.HIGH,
    data: { jobId: params.jobId } satisfies Prisma.JsonObject
  });
}

export async function notifyJobExpiringSoon(params: {
  posterUserId: string;
  jobId: string;
  jobTitle: string;
  daysLeft: number;
}) {
  await emitWorkflowNotification("job.expiring", {
    userId: params.posterUserId,
    type: NotificationType.JOB,
    title: "Job expiring soon",
    body: `"${params.jobTitle}" expires in ${params.daysLeft} day(s).`,
    priority: NotificationPriority.NORMAL,
    data: { jobId: params.jobId } satisfies Prisma.JsonObject
  });
}
