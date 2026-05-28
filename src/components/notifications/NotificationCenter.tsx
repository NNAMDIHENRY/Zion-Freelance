"use client";

import type { NotificationCategory, NotificationPriority } from "@prisma/client";
import { BellOff, CheckCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import {
  NotificationItem,
  type NotificationItemData
} from "@/components/notifications/NotificationItem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotificationStream } from "@/hooks/use-notification-stream";
import {
  archiveNotificationAction,
  markAllNotificationsReadAction,
  markNotificationReadAction
} from "@/lib/notifications/actions";
import { cn } from "@/lib/utils";

type Tab = "unread" | "recent" | "archived";

type ListResponse = {
  items: NotificationItemData[];
  unread: number;
  nextCursor?: string;
};

const CATEGORIES: NotificationCategory[] = [
  "PROPOSAL",
  "CONTRACT",
  "MILESTONE",
  "PAYMENT",
  "ESCROW",
  "MESSAGE",
  "REVIEW",
  "SYSTEM",
  "SECURITY"
];

const PRIORITIES: NotificationPriority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];

export function NotificationCenter() {
  const [tab, setTab] = React.useState<Tab>("unread");
  const [items, setItems] = React.useState<NotificationItemData[]>([]);
  const [unread, setUnread] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [cursor, setCursor] = React.useState<string | undefined>();
  const [category, setCategory] = React.useState("");
  const [priority, setPriority] = React.useState("");

  const load = React.useCallback(
    async (opts?: { append?: boolean; nextCursor?: string }) => {
      const params = new URLSearchParams({ take: "25" });
      if (tab === "unread") params.set("read", "false");
      if (tab === "archived") params.set("archived", "true");
      if (category) params.set("category", category);
      if (priority) params.set("priority", priority);
      if (opts?.nextCursor) params.set("cursor", opts.nextCursor);

      const res = await fetch(`/api/notifications?${params}`, { credentials: "include" });
      if (!res.ok) return;
      const body = (await res.json()) as ListResponse;
      setUnread(body.unread ?? 0);
      setCursor(body.nextCursor);
      setItems((prev) =>
        opts?.append ? [...prev, ...(body.items ?? [])] : (body.items ?? [])
      );
    },
    [tab, category, priority]
  );

  React.useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  useNotificationStream({
    onNotification: () => void load(),
    onUnread: setUnread
  });

  async function handleMarkRead(id: string) {
    await markNotificationReadAction(id);
    await load();
  }

  async function handleMarkAll() {
    await markAllNotificationsReadAction();
    await load();
  }

  async function handleArchive(id: string) {
    await archiveNotificationAction(id);
    await load();
  }

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    await load({ append: true, nextCursor: cursor });
    setLoadingMore(false);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "unread", label: "Unread" },
    { id: "recent", label: "Recent" },
    { id: "archived", label: "Archived" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unread > 0 ? `${unread} unread` : "You're all caught up"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void handleMarkAll()}>
            <CheckCheck className="mr-1.5 h-4 w-4" />
            Mark all read
          </Button>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/dashboard/settings/notifications">Preferences</Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader className="space-y-4 border-b border-border/60 pb-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                  tab === t.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Category
              <select
                className="h-9 rounded-md border border-border/60 bg-background px-2 text-sm text-foreground"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Priority
              <select
                className="h-9 rounded-md border border-border/60 bg-background px-2 text-sm text-foreground"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="">All</option>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <BellOff className="h-10 w-10 text-muted-foreground/50" />
              <CardTitle className="text-base">No notifications here</CardTitle>
              <CardDescription>
                {tab === "unread"
                  ? "New activity will appear when something needs your attention."
                  : "Nothing in this view yet."}
              </CardDescription>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {items.map((item) => (
                <NotificationItem
                  key={item.id}
                  item={item}
                  onMarkRead={(id) => void handleMarkRead(id)}
                  onArchive={(id) => void handleArchive(id)}
                />
              ))}
            </div>
          )}
          {cursor && items.length > 0 ? (
            <div className="border-t border-border/60 p-4 text-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loadingMore}
                onClick={() => void loadMore()}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading…
                  </>
                ) : (
                  "Load more"
                )}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
