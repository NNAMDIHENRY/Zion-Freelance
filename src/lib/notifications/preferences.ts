import "server-only";

import { NotificationCategory } from "@prisma/client";

import { NOTIFICATION_CATEGORIES } from "@/lib/notifications/categories";
import { prisma } from "@/lib/db";

export type NotificationPreferenceRow = {
  category: NotificationCategory;
  inApp: boolean;
  email: boolean;
  realtime: boolean;
};

const defaults: NotificationPreferenceRow[] = NOTIFICATION_CATEGORIES.map((category) => ({
  category,
  inApp: true,
  email: category !== NotificationCategory.MESSAGE,
  realtime: true
}));

async function userExists(userId: string) {
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });
  return Boolean(row);
}

export async function ensureNotificationPreferences(userId: string) {
  if (!(await userExists(userId))) {
    throw new Error("User not found");
  }

  const existing = await prisma.notificationPreference.findMany({
    where: { userId },
    select: { category: true }
  });
  const have = new Set(existing.map((r) => r.category));
  const missing = NOTIFICATION_CATEGORIES.filter((c) => !have.has(c));
  if (missing.length === 0) return;

  const now = new Date();
  await prisma.$transaction(
    missing.map((category) => {
      const row = defaults.find((d) => d.category === category)!;
      return prisma.notificationPreference.upsert({
        where: { userId_category: { userId, category } },
        create: {
          userId,
          category,
          inApp: row.inApp,
          email: row.email,
          realtime: row.realtime,
          updatedAt: now
        },
        update: {}
      });
    })
  );
}

export async function getPreferencesForUser(
  userId: string
): Promise<NotificationPreferenceRow[]> {
  if (!(await userExists(userId))) {
    return defaults;
  }

  await ensureNotificationPreferences(userId);
  const rows = await prisma.notificationPreference.findMany({
    where: { userId },
    select: { category: true, inApp: true, email: true, realtime: true }
  });
  const byCat = new Map(rows.map((r) => [r.category, r]));
  return NOTIFICATION_CATEGORIES.map((category) => {
    const row = byCat.get(category);
    return row ?? defaults.find((d) => d.category === category)!;
  });
}

export async function getPreferenceForCategory(
  userId: string,
  category: NotificationCategory
): Promise<NotificationPreferenceRow> {
  const all = await getPreferencesForUser(userId);
  return (
    all.find((p) => p.category === category) ??
    defaults.find((d) => d.category === category) ?? {
      category,
      inApp: true,
      email: true,
      realtime: true
    }
  );
}

export async function updateNotificationPreferences(
  userId: string,
  updates: Partial<Record<NotificationCategory, Partial<NotificationPreferenceRow>>>
) {
  if (!(await userExists(userId))) {
    throw new Error("User not found");
  }

  await ensureNotificationPreferences(userId);
  await prisma.$transaction(
    Object.entries(updates).map(([category, patch]) =>
      prisma.notificationPreference.update({
        where: { userId_category: { userId, category: category as NotificationCategory } },
        data: {
          ...(patch?.inApp !== undefined ? { inApp: patch.inApp } : {}),
          ...(patch?.email !== undefined ? { email: patch.email } : {}),
          ...(patch?.realtime !== undefined ? { realtime: patch.realtime } : {})
        }
      })
    )
  );
}
