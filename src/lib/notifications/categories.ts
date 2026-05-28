import { NotificationCategory, NotificationType } from "@prisma/client";

export const NOTIFICATION_CATEGORIES = [
  NotificationCategory.PROPOSAL,
  NotificationCategory.CONTRACT,
  NotificationCategory.MILESTONE,
  NotificationCategory.PAYMENT,
  NotificationCategory.ESCROW,
  NotificationCategory.WITHDRAWAL,
  NotificationCategory.MESSAGE,
  NotificationCategory.REVIEW,
  NotificationCategory.DISPUTE,
  NotificationCategory.SYSTEM,
  NotificationCategory.SECURITY,
  NotificationCategory.JOB
] as const;

export function categoryForType(type: NotificationType): NotificationCategory {
  const map: Record<NotificationType, NotificationCategory> = {
    [NotificationType.MESSAGE]: NotificationCategory.MESSAGE,
    [NotificationType.PROPOSAL]: NotificationCategory.PROPOSAL,
    [NotificationType.CONTRACT]: NotificationCategory.CONTRACT,
    [NotificationType.MILESTONE]: NotificationCategory.MILESTONE,
    [NotificationType.PAYMENT]: NotificationCategory.PAYMENT,
    [NotificationType.ESCROW]: NotificationCategory.ESCROW,
    [NotificationType.WITHDRAWAL]: NotificationCategory.WITHDRAWAL,
    [NotificationType.REVIEW]: NotificationCategory.REVIEW,
    [NotificationType.DISPUTE]: NotificationCategory.DISPUTE,
    [NotificationType.SYSTEM]: NotificationCategory.SYSTEM,
    [NotificationType.SECURITY]: NotificationCategory.SECURITY,
    [NotificationType.JOB]: NotificationCategory.JOB
  };
  return map[type];
}

export function categoryLabel(category: NotificationCategory): string {
  const labels: Record<NotificationCategory, string> = {
    [NotificationCategory.PROPOSAL]: "Proposals",
    [NotificationCategory.CONTRACT]: "Contracts",
    [NotificationCategory.MILESTONE]: "Milestones",
    [NotificationCategory.PAYMENT]: "Payments",
    [NotificationCategory.ESCROW]: "Escrow",
    [NotificationCategory.WITHDRAWAL]: "Withdrawals",
    [NotificationCategory.MESSAGE]: "Messages",
    [NotificationCategory.REVIEW]: "Reviews",
    [NotificationCategory.DISPUTE]: "Disputes",
    [NotificationCategory.SYSTEM]: "System",
    [NotificationCategory.SECURITY]: "Account & security",
    [NotificationCategory.JOB]: "Jobs"
  };
  return labels[category];
}
