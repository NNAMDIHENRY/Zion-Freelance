import "server-only";

import {
  NotificationCategory,
  NotificationPriority,
  NotificationType,
  type Prisma
} from "@prisma/client";

import { dispatchEventNotification } from "@/lib/notifications/dispatch";
import { prisma } from "@/lib/db";

export type NotificationListFilter = {
  read?: boolean;
  archived?: boolean;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  cursor?: string;
  take?: number;
};

export async function createMessageNotification(params: {
  recipientUserId: string;
  senderName: string;
  conversationId: string;
  snippet: string;
}) {
  const body =
    params.snippet.length > 160 ? `${params.snippet.slice(0, 157)}…` : params.snippet;
  await dispatchEventNotification({
    userId: params.recipientUserId,
    type: NotificationType.MESSAGE,
    title: `New message from ${params.senderName}`,
    body,
    priority: NotificationPriority.NORMAL,
    data: { conversationId: params.conversationId } satisfies Prisma.JsonObject,
    skipEmail: true
  });
}

export async function listNotificationsForUser(
  userId: string,
  filter: NotificationListFilter = {}
) {
  const take = Math.min(filter.take ?? 30, 50);
  const archived = filter.archived ?? false;

  const where: Prisma.NotificationWhereInput = {
    userId,
    archivedAt: archived ? { not: null } : null,
    ...(filter.read !== undefined ? { read: filter.read } : {}),
    ...(filter.category ? { category: filter.category } : {}),
    ...(filter.priority ? { priority: filter.priority } : {})
  };

  const rows = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(filter.cursor
      ? { cursor: { id: filter.cursor }, skip: 1 }
      : {}),
    select: {
      id: true,
      type: true,
      category: true,
      priority: true,
      title: true,
      body: true,
      read: true,
      archivedAt: true,
      createdAt: true,
      data: true
    }
  });

  const hasMore = rows.length > take;
  const items = hasMore ? rows.slice(0, take) : rows;
  const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

  return { items, nextCursor };
}

export async function countUnreadNotifications(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { unreadNotificationCount: true }
  });
  if (user) return Math.max(0, user.unreadNotificationCount);

  return prisma.notification.count({
    where: { userId, read: false, archivedAt: null }
  });
}

export async function syncUnreadNotificationCount(userId: string) {
  const count = await prisma.notification.count({
    where: { userId, read: false, archivedAt: null }
  });
  await prisma.user.update({
    where: { id: userId },
    data: { unreadNotificationCount: count }
  });
  return count;
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const row = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
    select: { read: true }
  });
  if (!row) return false;
  if (row.read) return true;

  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true, readAt: new Date() }
  });
  await syncUnreadNotificationCount(userId);
  return true;
}

export async function markAllNotificationsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, read: false, archivedAt: null },
    data: { read: true, readAt: new Date() }
  });
  if (result.count > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { unreadNotificationCount: 0 }
    });
  }
  return result.count;
}

export async function archiveNotification(userId: string, notificationId: string) {
  const row = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
    select: { read: true, archivedAt: true }
  });
  if (!row || row.archivedAt) return false;

  await prisma.notification.update({
    where: { id: notificationId },
    data: { archivedAt: new Date(), read: true, readAt: new Date() }
  });

  if (!row.read) {
    await syncUnreadNotificationCount(userId);
  }
  return true;
}
