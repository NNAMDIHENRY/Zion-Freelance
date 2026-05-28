import "server-only";

import { NotificationPriority, NotificationType, type Prisma } from "@prisma/client";

import { dispatchEventNotification } from "@/lib/notifications/dispatch";

export async function createPaymentNotification(params: {
  userId: string;
  type: "PAYMENT" | "ESCROW" | "WITHDRAWAL";
  title: string;
  body: string;
  data?: Prisma.JsonObject;
  priority?: NotificationPriority;
}) {
  const typeMap = {
    PAYMENT: NotificationType.PAYMENT,
    ESCROW: NotificationType.ESCROW,
    WITHDRAWAL: NotificationType.WITHDRAWAL
  } as const;

  await dispatchEventNotification({
    userId: params.userId,
    type: typeMap[params.type],
    title: params.title,
    body: params.body,
    priority: params.priority ?? NotificationPriority.NORMAL,
    data: params.data
  });
}
