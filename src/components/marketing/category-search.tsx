"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MARKETPLACE_CATEGORIES } from "@/lib/marketing/categories-data";
import { cn } from "@/lib/utils";

function useHashActive() {
  const [hash, setHash] = React.useState("");

  React.useEffect(() => {
    const read = () => setHash(window.location.hash.replace(/^#/, ""));
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  return hash;
}

export function CategorySearchGrid({ className }: { className?: string }) {
  const Box = "div" as const;
  const [q, setQ] = React.useState("");
  const activeHash = useHashActive();

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return MARKETPLACE_CATEGORIES;
    return MARKETPLACE_CATEGORIES.filter((c) => {
      const hay = `${c.name} ${c.description} ${c.tags.join(" ")}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [q]);

  return (
    <Box className={cn("space-y-8", className)}>
      <Box className="relative mx-auto max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search categories, skills, or keywords..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-12 rounded-xl border-border/80 pl-10 shadow-subtle"
          aria-label="Search categories"
        />
      </Box>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => {
          const isActive = activeHash === c.slug;
          return (
            <li key={c.slug} id={c.slug}>
              <Link href={`/categories/${c.slug}`} className="group block h-full">
                <Card
                  className={cn(
                    "h-full border-border/70 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-primary/35 group-hover:shadow-md",
                    isActive && "border-primary ring-2 ring-primary/20"
                  )}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{c.name}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {c.description}
                    </CardDescription>
                    <Box className="mt-4 flex flex-wrap gap-2">
                      {c.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                    </Box>
                  </CardHeader>
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
      {filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          No categories match &ldquo;{q}&rdquo;. Try web development, design, or marketing.
        </p>
      ) : null}
    </Box>
  );
}
