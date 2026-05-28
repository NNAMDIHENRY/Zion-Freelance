import { MilestoneStatus } from "@prisma/client";

/** User-facing milestone status labels (maps escrow workflow to freelance terms). */
export const MILESTONE_STATUS_LABEL: Record<MilestoneStatus, string> = {
  [MilestoneStatus.PENDING]: "Pending",
  [MilestoneStatus.FUNDED]: "Funded",
  [MilestoneStatus.ACTIVE]: "In progress",
  [MilestoneStatus.SUBMITTED]: "Submitted",
  [MilestoneStatus.APPROVED]: "Approved",
  [MilestoneStatus.RELEASED]: "Paid"
};

export function milestoneStatusLabel(status: MilestoneStatus): string {
  return MILESTONE_STATUS_LABEL[status] ?? status;
}
