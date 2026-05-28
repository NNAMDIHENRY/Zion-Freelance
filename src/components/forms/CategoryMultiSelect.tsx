"use client";

import { MARKETPLACE_CATEGORIES } from "@/lib/marketing/categories-data";
import { cn } from "@/lib/utils";

type CategoryMultiSelectProps = {
  value: string[];
  onChange: (slugs: string[]) => void;
  error?: string;
  max?: number;
};

export function CategoryMultiSelect({
  value,
  onChange,
  error,
  max = 5
}: CategoryMultiSelectProps) {
  const set = new Set(value);

  function toggle(slug: string) {
    const next = new Set(set);
    if (next.has(slug)) next.delete(slug);
    else if (next.size < max) next.add(slug);
    onChange([...next]);
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Categories (up to {max})</label>
      <ul className="grid gap-2 sm:grid-cols-2">
        {MARKETPLACE_CATEGORIES.map((c) => {
          const active = set.has(c.slug);
          return (
            <li key={c.slug}>
              <button
                type="button"
                onClick={() => toggle(c.slug)}
                className={cn(
                  "w-full rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                  active
                    ? "border-primary bg-primary/5 ring-2 ring-ring"
                    : "border-border hover:bg-muted/60"
                )}
              >
                <span className="font-medium">{c.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
