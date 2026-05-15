"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Dropdown } from "@/components/dashboard/ui/Dropdown";

import type { TaxonomyOption } from "./project-types";

type SkillMultiSelectProps = {
  options: TaxonomyOption[];
  value: string[];
  onChange: (next: string[]) => void;
  error?: string;
};

export function SkillMultiSelect({ options, value, onChange, error }: SkillMultiSelectProps) {
  const set = React.useMemo(() => new Set(value), [value]);

  function toggle(id: string) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  }

  const label =
    value.length === 0 ? "Select skills" : `${value.length} skill${value.length === 1 ? "" : "s"} selected`;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Skills required</span>
      <Dropdown
        align="start"
        trigger={
          <Button type="button" variant="outline" className="h-10 w-full justify-between font-normal">
            <span className="truncate text-left">{label}</span>
            <span className="text-muted-foreground">▾</span>
          </Button>
        }
        contentClassName="max-h-72 overflow-y-auto p-2"
      >
        <div className="flex flex-col gap-1">
          {options.map((s) => {
            const active = set.has(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  active ? "bg-primary/10 text-foreground" : "hover:bg-muted/60"
                )}
              >
                <span>{s.name}</span>
                <span className="text-xs text-muted-foreground">{active ? "✓" : ""}</span>
              </button>
            );
          })}
        </div>
      </Dropdown>
      {error ? (
        <p className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Pick every skill that matters for delivery quality.</p>
      )}
    </div>
  );
}
