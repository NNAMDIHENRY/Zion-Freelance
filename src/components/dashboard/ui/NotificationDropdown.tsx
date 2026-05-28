"use client";

import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import type { NotificationType } from "@prisma/client";

import {
  NotificationItem,
  type NotificationItemData
} from "@/components/notifications/NotificationItem";
import { Button } from "@/components/ui/button";
import { useNotificationStream } from "@/hooks/use-notification-stream";
import { resolveNotificationHref } from "@/lib/notifications/links";
import { cn } from "@/lib/utils";

import { Dropdown } from "./Dropdown";

type Item = NotificationItemData;

export function NotificationDropdown() {
  const router = useRouter();
  const [items, setItems] = React.useState<Item[]>([]);
  const [unread, setUnread] = React.useState(0);

  const load = React.useCallback(async () => {
    try {
      const response = await fetch("/api/notifications?take=12", {
        credentials: "include"
      });
      if (!response.ok) return;
      const body = (await response.json()) as { items?: Item[]; unread?: number };
      setItems(Array.isArray(body.items) ? body.items : []);
      setUnread(typeof body.unread === "number" ? body.unread : 0);
    } catch {
      undefined;
    }
  }, []);

  useNotificationStream({
    onNotification: () => void load(),
    onUnread: setUnread
  });

  React.useEffect(() => {
    void load();
    function onVis() {
      if (document.visibilityState === "visible") void load();
    }
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [load]);

  async function markAndOpen(entry: Item) {
    await fetch(`/api/notifications/${entry.id}/read`, {
      method: "POST",
      credentials: "include"
    });
    await load();
    const href = resolveNotificationHref(entry.type as NotificationType, entry.data);
    if (href) router.push(href);
  }

  async function markAllRead() {
    await fetch("/api/notifications/read-all", {
      method: "POST",
      credentials: "include"
    });
    await load();
  }

  const labelUnread = unread > 99 ? "99+" : String(unread);

  return (
    <Dropdown
      align="end"
      trigger={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-lg border border-transparent hover:border-border/60 hover:bg-accent"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 ? (
            <span className="absolute right-1.5 top-1.5 rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
              {labelUnread}
            </span>
          ) : null}
        </Button>
      }
      contentClassName="max-h-[24rem] min-w-[20rem] overflow-hidden p-0"
    >
      <div className="border-b border-border/60 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">
              {unread ? `${labelUnread} unread` : "You're clear"}
            </p>
          </div>
          {unread > 0 ? (
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => void markAllRead()}>
              Mark all read
            </Button>
          ) : null}
        </div>
      </div>
      <ul className="max-h-72 overflow-y-auto divide-y divide-border/50">
        {items.length === 0 ? (
          <li className="px-4 py-6 text-sm text-muted-foreground">Quiet on the wires.</li>
        ) : (
          items.map((notice) => (
            <li
              key={notice.id}
              className={cn("cursor-pointer", !notice.read && "bg-primary/5")}
              onClick={() => void markAndOpen(notice)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") void markAndOpen(notice);
              }}
              role="button"
              tabIndex={0}
            >
              <NotificationItem item={notice} compact />
            </li>
          ))
        )}
      </ul>
      <div className="border-t border-border/60 p-2">
        <Button type="button" variant="ghost" size="sm" className="w-full" asChild>
          <Link href="/dashboard/notifications">View notification center</Link>
        </Button>
      </div>
    </Dropdown>
  );
}
