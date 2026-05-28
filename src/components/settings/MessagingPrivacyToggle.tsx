"use client";

import { useState } from "react";
import { toast } from "sonner";

export function MessagingPrivacyToggle({ initial }: { initial: boolean }) {
  const [value, setValue] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function toggle(next: boolean) {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/messaging", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ allowMessagesFromEveryone: next })
      });
      if (!res.ok) throw new Error("fail");
      setValue(next);
      toast.success(next ? "Anyone can message you" : "Only existing contacts can reach you via proposals");
    } catch {
      toast.error("Could not update setting");
    } finally {
      setLoading(false);
    }
  }

  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 px-3 py-3 text-sm">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-input"
        checked={value}
        disabled={loading}
        onChange={(e) => void toggle(e.target.checked)}
      />
      <span>
        <span className="font-medium text-foreground">Allow messages from everyone</span>
        <span className="mt-1 block text-xs text-muted-foreground">
          When off, users cannot start new direct chats with you. Proposal threads still work.
        </span>
      </span>
    </label>
  );
}
