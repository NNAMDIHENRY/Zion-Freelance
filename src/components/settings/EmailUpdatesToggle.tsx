"use client";

import * as React from "react";
import { toast } from "sonner";

import { updateEmailUpdatesPreference } from "@/lib/settings/actions";

export function EmailUpdatesToggle({ initial }: { initial: boolean }) {
  const [enabled, setEnabled] = React.useState(initial);
  const [pending, setPending] = React.useState(false);

  async function toggle(next: boolean) {
    setEnabled(next);
    setPending(true);
    const res = await updateEmailUpdatesPreference(next);
    setPending(false);
    if (!res.ok) {
      setEnabled(!next);
      toast.error(res.error);
      return;
    }
    toast.success("Email preference saved");
  }

  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 px-4 py-3">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4"
        checked={enabled}
        disabled={pending}
        onChange={(e) => void toggle(e.target.checked)}
      />
      <span className="text-sm">
        <span className="font-medium text-foreground">Email updates</span>
        <span className="mt-1 block text-muted-foreground">
          Master switch for marketing and notification emails (category preferences still apply).
        </span>
      </span>
    </label>
  );
}
