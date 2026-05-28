import "server-only";

import {
  NotificationPriority,
  NotificationType,
  type Prisma
} from "@prisma/client";

import { categoryForType } from "@/lib/notifications/categories";
import { sendTransactionalEmail } from "@/lib/notifications/email/provider";
import { renderNotificationEmail } from "@/lib/notifications/email/templates";
import { resolveNotificationHref } from "@/lib/notifications/links";
import { getPreferenceForCategory } from "@/lib/notifications/preferences";
import { publishUserNotification } from "@/lib/notifications/realtime";
import { prisma } from "@/lib/db";

export type DispatchNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  priority?: NotificationPriority;
  data?: Prisma.JsonObject;
  /** Skip outbound email even if preference allows it. */
  skipEmail?: boolean;
  emailCtaLabel?: string;
};

function appOrigin() {
  return (
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ??
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

async function adjustUnreadCount(userId: string, delta: number) {
  if (delta === 0) return;
  await prisma.user.update({
    where: { id: userId },
    data: {
      unreadNotificationCount: {
        increment: delta
      }
    }
  });
}

export async function createNotification(input: DispatchNotificationInput) {
  return dispatchEventNotification(input);
}

/** Central workflow notification dispatcher (in-app, email, realtime). */
export async function dispatchEventNotification(input: DispatchNotificationInput) {
  const category = categoryForType(input.type);
  const prefs = await getPreferenceForCategory(input.userId, category);

  let created: {
    id: string;
    type: NotificationType;
    category: typeof category;
    priority: NotificationPriority;
    title: string;
    body: string;
    read: boolean;
    createdAt: Date;
    data: Prisma.JsonValue;
  } | null = null;

  if (prefs.inApp) {
    created = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        category,
        priority: input.priority ?? NotificationPriority.NORMAL,
        title: input.title,
        body: input.body,
        read: false,
        data: input.data
      },
      select: {
        id: true,
        type: true,
        category: true,
        priority: true,
        title: true,
        body: true,
        read: true,
        createdAt: true,
        data: true
      }
    });
    await adjustUnreadCount(input.userId, 1);

    const unread = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { unreadNotificationCount: true }
    });

    if (prefs.realtime) {
      publishUserNotification(input.userId, {
        id: created.id,
        type: created.type,
        category: created.category,
        priority: created.priority,
        title: created.title,
        body: created.body,
        read: created.read,
        createdAt: created.createdAt.toISOString(),
        data: created.data,
        unread: unread?.unreadNotificationCount ?? 0
      });
    }
  }

  if (!input.skipEmail && prefs.email) {
    void sendNotificationEmail(input).catch((err) => {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn("[notifications:email]", err);
      }
    });
  }

  return created;
}

async function sendNotificationEmail(input: DispatchNotificationInput) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { email: true, name: true, receiveEmailUpdates: true }
  });
  if (!user?.receiveEmailUpdates) return;
  if (!user?.email) return;

  const href = resolveNotificationHref(input.type, input.data);
  const ctaUrl = href ? `${appOrigin()}${href}` : undefined;
  const rendered = renderNotificationEmail({
    recipientName: user.name,
    title: input.title,
    body: input.body,
    ctaLabel: input.emailCtaLabel ?? "View in dashboard",
    ctaUrl
  });

  await sendTransactionalEmail({
    to: user.email,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text
  });
}

export async function emitWorkflowNotification(
  event: string,
  input: DispatchNotificationInput
) {
  return dispatchEventNotification({
    ...input,
    data: { ...(input.data ?? {}), event } satisfies Prisma.JsonObject
  });
}
