"use client";

import * as React from "react";

type StreamPayload = {
  unread?: number;
};

type Options = {
  onNotification?: (payload: unknown) => void;
  onUnread?: (count: number) => void;
  enabled?: boolean;
};

export function useNotificationStream(options: Options = {}) {
  const { onNotification, onUnread, enabled = true } = options;
  const onNotificationRef = React.useRef(onNotification);
  const onUnreadRef = React.useRef(onUnread);

  React.useEffect(() => {
    onNotificationRef.current = onNotification;
    onUnreadRef.current = onUnread;
  });

  React.useEffect(() => {
    if (!enabled) return;

    const source = new EventSource("/api/notifications/stream", {
      withCredentials: true
    });

    source.addEventListener("notification", (ev) => {
      try {
        const payload = JSON.parse((ev as MessageEvent).data) as StreamPayload & {
          unread: number;
        };
        onNotificationRef.current?.(payload);
        if (typeof payload.unread === "number") {
          onUnreadRef.current?.(payload.unread);
        }
      } catch {
        undefined;
      }
    });

    return () => {
      source.close();
    };
  }, [enabled]);
}
