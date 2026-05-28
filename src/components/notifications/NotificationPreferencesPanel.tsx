"use client";

import type { NotificationCategory } from "@prisma/client";
import { Loader2 } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { categoryLabel } from "@/lib/notifications/categories";
import { saveNotificationPreferencesAction } from "@/lib/notifications/actions";

type PrefRow = {
  category: NotificationCategory;
  inApp: boolean;
  email: boolean;
  realtime: boolean;
};

export function NotificationPreferencesPanel() {
  const [rows, setRows] = React.useState<PrefRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/notifications/preferences", { credentials: "include" });
        if (!res.ok) return;
        const body = (await res.json()) as { preferences?: PrefRow[] };
        setRows(Array.isArray(body.preferences) ? body.preferences : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function patch(category: NotificationCategory, field: keyof Omit<PrefRow, "category">, value: boolean) {
    setRows((prev) =>
      prev.map((r) => (r.category === category ? { ...r, [field]: value } : r))
    );
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    const payload: Record<string, { inApp: boolean; email: boolean; realtime: boolean }> = {};
    for (const row of rows) {
      payload[row.category] = {
        inApp: row.inApp,
        email: row.email,
        realtime: row.realtime
      };
    }
    const res = await saveNotificationPreferencesAction(payload);
    setSaving(false);
    setMessage(res.ok ? "Preferences saved." : res.error);
  }

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading preferences…
      </p>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification preferences</CardTitle>
        <CardDescription>
          Control in-app, email, and realtime alerts per category.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Category</th>
                <th className="pb-2 px-2 font-medium">In-app</th>
                <th className="pb-2 px-2 font-medium">Email</th>
                <th className="pb-2 pl-2 font-medium">Realtime</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.category} className="border-b border-border/40">
                  <td className="py-3 pr-4 font-medium">{categoryLabel(row.category)}</td>
                  {(["inApp", "email", "realtime"] as const).map((field) => (
                    <td key={field} className="py-3 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={row[field]}
                        onChange={(e) => patch(row.category, field, e.target.checked)}
                        className="h-4 w-4 rounded border-border"
                        aria-label={`${categoryLabel(row.category)} ${field}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        <Button type="button" disabled={saving} onClick={() => void save()}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save preferences"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
