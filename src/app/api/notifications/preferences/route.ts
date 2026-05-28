import { NotificationCategory } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import {
  getPreferencesForUser,
  updateNotificationPreferences
} from "@/lib/notifications/preferences";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await getPreferencesForUser(session.user.id);
    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("GET /api/notifications/preferences", error);
    return NextResponse.json(
      { error: "Failed to load notification preferences" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const updates: Partial<
      Record<NotificationCategory, { inApp?: boolean; email?: boolean; realtime?: boolean }>
    > = {};

    for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
      if (!(key in NotificationCategory)) continue;
      if (!value || typeof value !== "object") continue;
      const row = value as Record<string, unknown>;
      updates[key as NotificationCategory] = {
        ...(typeof row.inApp === "boolean" ? { inApp: row.inApp } : {}),
        ...(typeof row.email === "boolean" ? { email: row.email } : {}),
        ...(typeof row.realtime === "boolean" ? { realtime: row.realtime } : {})
      };
    }

    await updateNotificationPreferences(session.user.id, updates);
    const preferences = await getPreferencesForUser(session.user.id);
    return NextResponse.json({ ok: true, preferences });
  } catch (error) {
    console.error("PUT /api/notifications/preferences", error);
    return NextResponse.json(
      { error: "Failed to update notification preferences" },
      { status: 500 }
    );
  }
}
