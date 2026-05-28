"use client";

import * as React from "react";
import { EmploymentType, ExperienceLevel, WorkMode } from "@prisma/client";
import { Search } from "lucide-react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { CountrySelect } from "@/components/forms/CountrySelect";
import { Input } from "@/components/ui/input";
import { useSearchUrl } from "@/components/search/use-search-url";
import { cn } from "@/lib/utils";

type Taxonomy = {
  categories: { id: string; name: string; slug: string }[];
};

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "salary_desc", label: "Salary (high)" },
  { value: "salary_asc", label: "Salary (low)" },
  { value: "deadline", label: "Deadline soon" }
] as const;

export function JobSearchFilters({
  className,
  taxonomy
}: {
  className?: string;
  taxonomy: Taxonomy;
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

  const setParam = (key: string, value: string) => {
    replaceParams((p) => {
      if (value) p.set(key, value);
      else p.delete(key);
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
          placeholder="Job title, company, skills…"
          className="h-11 rounded-xl pl-10"
          aria-label="Search jobs"
        />
      </div>

      <FilterBlock label="Sort">
        <select
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          value={searchParams.get("sort") ?? "newest"}
          onChange={(e) => setParam("sort", e.target.value === "newest" ? "" : e.target.value)}
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </FilterBlock>

      <FilterBlock label="Category">
        <select
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          value={searchParams.get("category") ?? ""}
          onChange={(e) => setParam("category", e.target.value)}
        >
          <option value="">All categories</option>
          {taxonomy.categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </FilterBlock>

      <FilterBlock label="Work mode">
        <select
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          value={searchParams.get("workMode") ?? ""}
          onChange={(e) => setParam("workMode", e.target.value)}
        >
          <option value="">Any</option>
          {Object.values(WorkMode).map((m) => (
            <option key={m} value={m}>
              {m.charAt(0) + m.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </FilterBlock>

      <FilterBlock label="Employment">
        <select
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          value={searchParams.get("employmentType") ?? ""}
          onChange={(e) => setParam("employmentType", e.target.value)}
        >
          <option value="">Any</option>
          {Object.values(EmploymentType).map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </FilterBlock>

      <FilterBlock label="Experience">
        <select
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          value={searchParams.get("experienceLevel") ?? ""}
          onChange={(e) => setParam("experienceLevel", e.target.value)}
        >
          <option value="">Any</option>
          {Object.values(ExperienceLevel).map((l) => (
            <option key={l} value={l}>
              {l.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </FilterBlock>

      <FilterBlock label="Country">
        <CountrySelect
          label={null}
          value={searchParams.get("country") ?? ""}
          onChange={(v) => setParam("country", v)}
          placeholder="Any country"
        />
      </FilterBlock>

      <FilterBlock label="City">
        <Input
          value={searchParams.get("city") ?? ""}
          onChange={(e) => setParam("city", e.target.value)}
          placeholder="City"
          className="h-10"
        />
      </FilterBlock>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={searchParams.get("featured") === "1"}
          onChange={(e) => setParam("featured", e.target.checked ? "1" : "")}
          className="rounded border-input"
        />
        Featured only
      </label>
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
