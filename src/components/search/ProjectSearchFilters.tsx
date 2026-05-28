"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Input } from "@/components/ui/input";
import { PROJECT_BUDGET_PRESETS, PROJECT_SORTS, type ProjectSort } from "@/lib/search/constants";
import { projectSortLabel } from "@/lib/search/params";
import { cn } from "@/lib/utils";

import { useSearchUrl } from "./use-search-url";

type Taxonomy = {
  categories: { id: string; name: string }[];
  skills: { id: string; name: string }[];
};

export function ProjectSearchFilters({
  className,
  taxonomy,
  showBudgetCustom
}: {
  className?: string;
  taxonomy: Taxonomy;
  showBudgetCustom?: boolean;
}) {
  const { replaceParams, searchParams } = useSearchUrl();
  const [q, setQ] = React.useState(searchParams.get("q") ?? "");
  const debouncedQ = useDebouncedValue(q, 350);

  React.useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (debouncedQ === current) return;
    replaceParams((p) => {
      if (debouncedQ.trim()) p.set("q", debouncedQ.trim());
      else p.delete("q");
    });
  }, [debouncedQ, replaceParams, searchParams]);

  const category = searchParams.get("category") ?? "";
  const skills = searchParams.get("skills")?.split(",").filter(Boolean) ?? [];
  const budgetPreset = searchParams.get("budgetPreset") ?? "any";
  const budgetMin = searchParams.get("budgetMin") ?? "";
  const budgetMax = searchParams.get("budgetMax") ?? "";
  const sort = (searchParams.get("sort") as ProjectSort) || "newest";

  const toggleSkill = (id: string) => {
    replaceParams((p) => {
      const set = new Set(p.get("skills")?.split(",").filter(Boolean) ?? []);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      const next = [...set];
      if (next.length) p.set("skills", next.join(","));
      else p.delete("skills");
    });
  };

  return (
    <aside className={cn("space-y-6", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Title, description, skills…"
          className="h-11 rounded-xl pl-10"
          aria-label="Search projects"
        />
      </div>

      <FilterBlock label="Sort">
        <select
          value={sort}
          onChange={(e) =>
            replaceParams((p) => {
              const v = e.target.value as ProjectSort;
              if (v === "newest") p.delete("sort");
              else p.set("sort", v);
            })
          }
          className="h-10 w-full rounded-lg border border-border/80 bg-background px-3 text-sm"
        >
          {PROJECT_SORTS.map((s) => (
            <option key={s} value={s}>
              {projectSortLabel(s)}
            </option>
          ))}
        </select>
      </FilterBlock>

      <FilterBlock label="Category">
        <select
          value={category}
          onChange={(e) =>
            replaceParams((p) => {
              if (e.target.value) p.set("category", e.target.value);
              else p.delete("category");
            })
          }
          className="h-10 w-full rounded-lg border border-border/80 bg-background px-3 text-sm"
        >
          <option value="">All categories</option>
          {taxonomy.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </FilterBlock>

      <FilterBlock label="Budget">
        <select
          value={budgetPreset}
          onChange={(e) =>
            replaceParams((p) => {
              p.delete("budgetMin");
              p.delete("budgetMax");
              if (e.target.value === "any") p.delete("budgetPreset");
              else p.set("budgetPreset", e.target.value);
            })
          }
          className="h-10 w-full rounded-lg border border-border/80 bg-background px-3 text-sm"
        >
          {PROJECT_BUDGET_PRESETS.map((b) => (
            <option key={b.id} value={b.id}>
              {b.label}
            </option>
          ))}
        </select>
        {showBudgetCustom ? (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Input
              type="number"
              min={0}
              placeholder="Min"
              value={budgetMin}
              onChange={(e) =>
                replaceParams((p) => {
                  p.delete("budgetPreset");
                  if (e.target.value) p.set("budgetMin", e.target.value);
                  else p.delete("budgetMin");
                })
              }
              className="h-9 text-sm"
            />
            <Input
              type="number"
              min={0}
              placeholder="Max"
              value={budgetMax}
              onChange={(e) =>
                replaceParams((p) => {
                  p.delete("budgetPreset");
                  if (e.target.value) p.set("budgetMax", e.target.value);
                  else p.delete("budgetMax");
                })
              }
              className="h-9 text-sm"
            />
          </div>
        ) : null}
      </FilterBlock>

      <FilterBlock label="Skills">
        <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
          {taxonomy.skills.map((s) => {
            const on = skills.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSkill(s.id)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  on
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/80 text-muted-foreground hover:border-primary/40"
                )}
              >
                {s.name}
              </button>
            );
          })}
        </div>
      </FilterBlock>
    </aside>
  );
}

function FilterBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
