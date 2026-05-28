"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

type UserHit = { id: string; name: string; email: string; role: string };

export function NewConversationPanel() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const debounced = useDebouncedValue(q, 300);
  const [hits, setHits] = React.useState<UserHit[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [starting, setStarting] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || debounced.trim().length < 2) {
      setHits([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void fetch(`/api/users/search?q=${encodeURIComponent(debounced.trim())}`, {
      credentials: "include"
    })
      .then((r) => r.json())
      .then((j: { users?: UserHit[] }) => {
        if (!cancelled) setHits(j.users ?? []);
      })
      .catch(() => {
        if (!cancelled) setHits([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, open]);

  async function startWith(userId: string) {
    setStarting(userId);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ freelancerUserId: userId })
      });
      const j = (await res.json().catch(() => ({}))) as {
        conversationId?: string;
        error?: string;
      };
      if (!res.ok || !j.conversationId) {
        toast.error(j.error ?? "Could not start conversation");
        return;
      }
      setOpen(false);
      setQ("");
      router.push(`/dashboard/messages?conversation=${j.conversationId}`);
      router.refresh();
    } finally {
      setStarting(null);
    }
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <MessageSquarePlus className="mr-2 h-4 w-4" />
        Start conversation
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-subtle">
      <p className="text-sm font-semibold">Start a conversation</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Search for a freelancer you have shared proposal history with.
      </p>
      <Input
        className="mt-3"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name or email…"
        autoFocus
      />
      <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto">
        {loading ? (
          <li className="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching…
          </li>
        ) : null}
        {!loading && hits.length === 0 && debounced.trim().length >= 2 ? (
          <li className="px-2 py-2 text-sm text-muted-foreground">No users found.</li>
        ) : null}
        {hits.map((u) => (
          <li key={u.id}>
            <button
              type="button"
              disabled={Boolean(starting)}
              className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-muted"
              onClick={() => void startWith(u.id)}
            >
              <span>
                <span className="font-medium">{u.name}</span>
                <span className="block text-xs text-muted-foreground">{u.email}</span>
              </span>
              {starting === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            </button>
          </li>
        ))}
      </ul>
      <Button type="button" variant="ghost" size="sm" className="mt-3" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </div>
  );
}
