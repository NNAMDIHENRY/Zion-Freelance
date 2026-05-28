"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function DashboardSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const debounced = useDebouncedValue(q, 350);

  React.useEffect(() => {
    const term = debounced.trim();
    if (!term) return;
    router.push(`/dashboard/search?q=${encodeURIComponent(term)}`);
  }, [debounced, router]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    router.push(`/dashboard/search?q=${encodeURIComponent(term)}`);
  }

  return (
    <form onSubmit={onSubmit} className={cn("relative min-w-0 flex-1 md:max-w-md", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search projects, people, messages…"
        className="h-10 w-full rounded-lg border-border/60 bg-muted/40 pl-9 placeholder:text-muted-foreground/70"
        aria-label="Dashboard search"
      />
    </form>
  );
}
