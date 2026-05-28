"use server";

import "server-only";

import { NotificationCategory, type NotificationPriority } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth/session";
import {
  archiveNotification,
  markAllNotificationsRead,
  markNotificationRead
} from "@/lib/notifications/service";
import {
  getPreferencesForUser,
  updateNotificationPreferences
} from "@/lib/notifications/preferences";

type ActionErr = { ok: false; error: string };
type ActionOk<T extends object = object> = { ok: true } & T;

async function requireUser() {
  const session = await getSession();
  if (!session?.user?.id) return { ok: false as const, error: "Unauthorized" };
  return { ok: true as const, userId: session.user.id };
}

export async function markNotificationReadAction(
  notificationId: string
): Promise<ActionOk | ActionErr> {
  const auth = await requireUser();
  if (!auth.ok) return auth;
  const ok = await markNotificationRead(auth.userId, notificationId);
  if (!ok) return { ok: false, error: "Not found" };
  revalidatePath("/dashboard/notifications");
  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<ActionOk | ActionErr> {
  const auth = await requireUser();
  if (!auth.ok) return auth;
  await markAllNotificationsRead(auth.userId);
  revalidatePath("/dashboard/notifications");
  return { ok: true };
}

export async function archiveNotificationAction(
  notificationId: string
): Promise<ActionOk | ActionErr> {
  const auth = await requireUser();
  if (!auth.ok) return auth;
  const ok = await archiveNotification(auth.userId, notificationId);
  if (!ok) return { ok: false, error: "Not found" };
  revalidatePath("/dashboard/notifications");
  return { ok: true };
}

export async function saveNotificationPreferencesAction(
  input: Record<
    string,
    { inApp?: boolean; email?: boolean; realtime?: boolean } | undefined
  >
): Promise<ActionOk | ActionErr> {
  const auth = await requireUser();
  if (!auth.ok) return auth;

  const updates: Partial<
    Record<NotificationCategory, { inApp?: boolean; email?: boolean; realtime?: boolean }>
  > = {};

  for (const [key, value] of Object.entries(input)) {
    if (!value) continue;
    if (!Object.values(NotificationCategory).includes(key as NotificationCategory)) continue;
    updates[key as NotificationCategory] = value;
  }

  await updateNotificationPreferences(auth.userId, updates);
  revalidatePath("/dashboard/settings/notifications");
  return { ok: true };
}

export async function getNotificationPreferencesAction(): Promise<
  ActionOk<{ preferences: Awaited<ReturnType<typeof getPreferencesForUser>> }> | ActionErr
> {
  const auth = await requireUser();
  if (!auth.ok) return auth;
  const preferences = await getPreferencesForUser(auth.userId);
  return { ok: true, preferences };
}

export type { NotificationPriority };
