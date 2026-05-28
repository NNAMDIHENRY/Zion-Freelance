export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NotificationCategory, NotificationPriority } from "@prisma/client";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  countUnreadNotifications,
  listNotificationsForUser
} from "@/lib/notifications/service";

function parseEnum<T extends Record<string, string>>(
  enumObj: T,
  value: string | null
): T[keyof T] | undefined {
  if (!value) return undefined;
  return Object.values(enumObj).includes(value) ? (value as T[keyof T]) : undefined;
}

export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);

  const take = Math.min(Number(url.searchParams.get("take") ?? "30") || 30, 50);
  const cursor = url.searchParams.get("cursor") ?? undefined;

  const readParam = url.searchParams.get("read");
  const archived = url.searchParams.get("archived") === "true";

  const read =
    readParam === "true" ? true : readParam === "false" ? false : undefined;

  const [page, unread] = await Promise.all([
    listNotificationsForUser(session.user.id, {
      take,
      cursor,
      read,
      archived,
      category: parseEnum(NotificationCategory, url.searchParams.get("category")),
      priority: parseEnum(NotificationPriority, url.searchParams.get("priority"))
    }),
    countUnreadNotifications(session.user.id)
  ]);

  return NextResponse.json({
    unread,
    nextCursor: page.nextCursor,
    items: page.items.map((n) => ({
      id: n.id,
      type: n.type,
      category: n.category,
      priority: n.priority,
      title: n.title,
      body: n.body,
      read: n.read,
      archivedAt: n.archivedAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
      data: n.data
    }))
  });
}