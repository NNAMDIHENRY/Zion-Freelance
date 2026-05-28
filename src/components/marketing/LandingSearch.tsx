"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { MARKETPLACE_CATEGORIES } from "@/lib/marketing/categories-data";
import { cn } from "@/lib/utils";

const SUGGESTIONS = MARKETPLACE_CATEGORIES.slice(0, 6).map((c) => ({
  label: c.name,
  href: `/categories/${c.slug}`
}));

const Shell = "div" as const;

export function LandingSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);

  function submit(term: string) {
    const t = term.trim();
    if (!t) return;
    router.push(`/search?q=${encodeURIComponent(t)}`);
    setOpen(false);
  }

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return SUGGESTIONS;
    return [
      ...SUGGESTIONS,
      ...MARKETPLACE_CATEGORIES.filter((c) =>
        `${c.name} ${c.tags.join(" ")}`.toLowerCase().includes(needle)
      ).map((c) => ({ label: c.name, href: `/categories/${c.slug}` }))
    ].slice(0, 8);
  }, [q]);

  return (
    <Shell className={cn("relative w-full max-w-xl", className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(q);
        }}
        className="relative"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          placeholder="Search projects, categories, or skills…"
          className="h-12 rounded-xl border-border/80 pl-10 shadow-subtle"
          aria-label="Marketplace search"
        />
      </form>
      {open && filtered.length ? (
        <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border/70 bg-card py-1 shadow-lg">
          {filtered.map((s) => (
            <li key={s.href}>
              <Link
                href={s.href}
                className="block px-4 py-2.5 text-sm hover:bg-muted/60"
                onMouseDown={(e) => e.preventDefault()}
              >
                {s.label}
              </Link>
            </li>
          ))}
          {q.trim() ? (
            <li>
              <button
                type="button"
                className="block w-full px-4 py-2.5 text-left text-sm font-medium text-primary hover:bg-muted/60"
                onMouseDown={(e) => {
                  e.preventDefault();
                  submit(q);
                }}
              >
                Search for &ldquo;{q.trim()}&rdquo;
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </Shell>
  );
}
