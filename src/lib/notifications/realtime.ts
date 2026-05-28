import "server-only";

export type RealtimeNotificationPayload = {
  id: string;
  type: string;
  category: string;
  priority: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  data: unknown;
  unread: number;
};

type Listener = (payload: RealtimeNotificationPayload) => void;

const channels = new Map<string, Set<Listener>>();

export function subscribeUserNotifications(userId: string, listener: Listener) {
  let set = channels.get(userId);
  if (!set) {
    set = new Set();
    channels.set(userId, set);
  }
  set.add(listener);
  return () => {
    set?.delete(listener);
    if (set && set.size === 0) channels.delete(userId);
  };
}

export function publishUserNotification(userId: string, payload: RealtimeNotificationPayload) {
  const set = channels.get(userId);
  if (!set) return;
  for (const listener of set) {
    try {
      listener(payload);
    } catch {
      undefined;
    }
  }
}
