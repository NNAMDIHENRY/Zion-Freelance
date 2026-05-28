"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SkillOption = { id: string; name: string; slug: string };

type SkillsTagInputProps = {
  options: SkillOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  error?: string;
};

export function SkillsTagInput({ options, value, onChange, error }: SkillsTagInputProps) {
  const [q, setQ] = React.useState("");
  const selected = new Set(value);

  const filtered = options.filter((o) => {
    if (selected.has(o.id)) return false;
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return o.name.toLowerCase().includes(needle) || o.slug.includes(needle);
  });

  function toggle(id: string) {
    const next = new Set(value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Skills</label>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search skills…"
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
      />
      {value.length ? (
        <ul className="flex flex-wrap gap-2">
          {value.map((id) => {
            const skill = options.find((o) => o.id === id);
            return (
              <li key={id}>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-8 rounded-full"
                  onClick={() => toggle(id)}
                >
                  {skill?.name ?? id} ×
                </Button>
              </li>
            );
          })}
        </ul>
      ) : null}
      <ul className={cn("max-h-40 space-y-1 overflow-y-auto rounded-lg border p-2")}>
        {filtered.slice(0, 20).map((o) => (
          <li key={o.id}>
            <button
              type="button"
              className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
              onClick={() => toggle(o.id)}
            >
              {o.name}
            </button>
          </li>
        ))}
      </ul>
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
