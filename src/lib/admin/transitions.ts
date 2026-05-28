import {
  AbuseReportStatus,
  DisputeStatus,
  ProjectModerationStatus,
  WithdrawalStatus
} from "@prisma/client";

const PROJECT_MODERATION: Record<
  ProjectModerationStatus,
  readonly ProjectModerationStatus[]
> = {
  [ProjectModerationStatus.ACTIVE]: [
    ProjectModerationStatus.FLAGGED,
    ProjectModerationStatus.UNDER_REVIEW,
    ProjectModerationStatus.FROZEN,
    ProjectModerationStatus.REMOVED
  ],
  [ProjectModerationStatus.FLAGGED]: [
    ProjectModerationStatus.ACTIVE,
    ProjectModerationStatus.UNDER_REVIEW,
    ProjectModerationStatus.FROZEN,
    ProjectModerationStatus.REMOVED
  ],
  [ProjectModerationStatus.UNDER_REVIEW]: [
    ProjectModerationStatus.ACTIVE,
    ProjectModerationStatus.FLAGGED,
    ProjectModerationStatus.FROZEN,
    ProjectModerationStatus.REMOVED
  ],
  [ProjectModerationStatus.FROZEN]: [
    ProjectModerationStatus.ACTIVE,
    ProjectModerationStatus.UNDER_REVIEW,
    ProjectModerationStatus.REMOVED
  ],
  [ProjectModerationStatus.REMOVED]: [ProjectModerationStatus.UNDER_REVIEW]
};

const DISPUTE: Record<DisputeStatus, readonly DisputeStatus[]> = {
  [DisputeStatus.OPEN]: [DisputeStatus.UNDER_REVIEW, DisputeStatus.ESCALATED, DisputeStatus.DISMISSED],
  [DisputeStatus.UNDER_REVIEW]: [
    DisputeStatus.ESCALATED,
    DisputeStatus.RESOLVED,
    DisputeStatus.DISMISSED
  ],
  [DisputeStatus.ESCALATED]: [DisputeStatus.RESOLVED, DisputeStatus.DISMISSED],
  [DisputeStatus.RESOLVED]: [],
  [DisputeStatus.DISMISSED]: []
};

const REPORT: Record<AbuseReportStatus, readonly AbuseReportStatus[]> = {
  [AbuseReportStatus.OPEN]: [AbuseReportStatus.UNDER_REVIEW, AbuseReportStatus.DISMISSED],
  [AbuseReportStatus.UNDER_REVIEW]: [
    AbuseReportStatus.RESOLVED,
    AbuseReportStatus.DISMISSED,
    AbuseReportStatus.ARCHIVED
  ],
  [AbuseReportStatus.RESOLVED]: [AbuseReportStatus.ARCHIVED],
  [AbuseReportStatus.DISMISSED]: [AbuseReportStatus.ARCHIVED],
  [AbuseReportStatus.ARCHIVED]: []
};

const WITHDRAWAL: Record<WithdrawalStatus, readonly WithdrawalStatus[]> = {
  [WithdrawalStatus.PENDING]: [
    WithdrawalStatus.UNDER_REVIEW,
    WithdrawalStatus.APPROVED,
    WithdrawalStatus.REJECTED,
    WithdrawalStatus.CANCELLED
  ],
  [WithdrawalStatus.UNDER_REVIEW]: [
    WithdrawalStatus.APPROVED,
    WithdrawalStatus.REJECTED,
    WithdrawalStatus.PENDING
  ],
  [WithdrawalStatus.APPROVED]: [WithdrawalStatus.PROCESSING, WithdrawalStatus.REJECTED],
  [WithdrawalStatus.PROCESSING]: [WithdrawalStatus.COMPLETED, WithdrawalStatus.REJECTED],
  [WithdrawalStatus.COMPLETED]: [],
  [WithdrawalStatus.REJECTED]: [],
  [WithdrawalStatus.CANCELLED]: []
};

function canTransition<T extends string>(
  map: Record<T, readonly T[]>,
  from: T,
  to: T
): boolean {
  return map[from]?.includes(to) ?? false;
}

export function canTransitionProjectModeration(
  from: ProjectModerationStatus,
  to: ProjectModerationStatus
) {
  return canTransition(PROJECT_MODERATION, from, to);
}

export function assertProjectModerationTransition(
  from: ProjectModerationStatus,
  to: ProjectModerationStatus
) {
  if (!canTransitionProjectModeration(from, to)) {
    throw new Error(`Invalid project moderation transition: ${from} → ${to}`);
  }
}

export function canTransitionDispute(from: DisputeStatus, to: DisputeStatus) {
  return canTransition(DISPUTE, from, to);
}

export function assertDisputeTransition(from: DisputeStatus, to: DisputeStatus) {
  if (!canTransitionDispute(from, to)) {
    throw new Error(`Invalid dispute transition: ${from} → ${to}`);
  }
}

export function canTransitionAbuseReport(from: AbuseReportStatus, to: AbuseReportStatus) {
  return canTransition(REPORT, from, to);
}

export function assertAbuseReportTransition(from: AbuseReportStatus, to: AbuseReportStatus) {
  if (!canTransitionAbuseReport(from, to)) {
    throw new Error(`Invalid report transition: ${from} → ${to}`);
  }
}

export function canTransitionWithdrawal(from: WithdrawalStatus, to: WithdrawalStatus) {
  return canTransition(WITHDRAWAL, from, to);
}

export function assertWithdrawalTransition(from: WithdrawalStatus, to: WithdrawalStatus) {
  if (!canTransitionWithdrawal(from, to)) {
    throw new Error(`Invalid withdrawal transition: ${from} → ${to}`);
  }
}

/** Terminal withdrawal states — no duplicate approval. */
export function isWithdrawalTerminal(status: WithdrawalStatus) {
  return (
    status === WithdrawalStatus.COMPLETED ||
    status === WithdrawalStatus.REJECTED ||
    status === WithdrawalStatus.CANCELLED
  );
}
