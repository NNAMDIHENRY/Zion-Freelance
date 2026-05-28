"use client";

import type { NotificationCategory, NotificationPriority, NotificationType } from "@prisma/client";
import { Archive, ExternalLink } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { resolveNotificationHref } from "@/lib/notifications/links";
import { cn } from "@/lib/utils";

export type NotificationItemData = {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  data: unknown;
};

type Props = {
  item: NotificationItemData;
  onMarkRead?: (id: string) => void;
  onArchive?: (id: string) => void;
  compact?: boolean;
};

function priorityClass(priority: NotificationPriority) {
  if (priority === "URGENT") return "border-l-red-500";
  if (priority === "HIGH") return "border-l-amber-500";
  if (priority === "LOW") return "border-l-muted";
  return "border-l-primary/40";
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString();
}

export function NotificationItem({ item, onMarkRead, onArchive, compact }: Props) {
  const href = resolveNotificationHref(item.type, item.data);

  return (
    <article
      className={cn(
        "border-l-2 px-4 py-3 transition",
        priorityClass(item.priority),
        !item.read && "bg-primary/5"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-tight">{item.title}</p>
          {!compact ? (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{item.body}</p>
          ) : null}
          <p className="mt-1.5 text-[11px] uppercase tracking-wide text-muted-foreground/80">
            {item.category} · {formatWhen(item.createdAt)}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          {!item.read && onMarkRead ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onMarkRead(item.id)}
            >
              Read
            </Button>
          ) : null}
          {onArchive ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label="Archive"
              onClick={() => onArchive(item.id)}
            >
              <Archive className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>
      </div>
      {href ? (
        <Link
          href={href}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          onClick={() => !item.read && onMarkRead?.(item.id)}
        >
          Open
          <ExternalLink className="h-3 w-3" />
        </Link>
      ) : null}
    </article>
  );
}
