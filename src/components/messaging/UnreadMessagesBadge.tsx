"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type Props = {
  pollMs?: number;
  className?: string;
};

export function UnreadMessagesBadge({ pollMs = 20000, className }: Props) {
  const [total, setTotal] = React.useState<number | null>(null);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch("/api/conversations/unread-total", { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as { unread?: number };
      const n = typeof data.unread === "number" ? data.unread : 0;
      setTotal(n > 0 ? n : 0);
    } catch {
      undefined;
    }
  }, []);

  React.useEffect(() => {
    void load();

    function onVisibility() {
      if (document.visibilityState === "visible") void load();
    }

    const intervalId = window.setInterval(load, pollMs);

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [load, pollMs]);

  if (total === null || total === 0) return null;

  const label = total > 99 ? "99+" : String(total);

  return (
    <span
      aria-label={`Unread messages ${label}`}
      className={cn(
        "inline-flex min-w-[18px] items-center justify-center rounded-full bg-primary px-1 py-px text-[10px] font-semibold tabular-nums text-primary-foreground",
        className
      )}
    >
      {label}
    </span>
  );
}
