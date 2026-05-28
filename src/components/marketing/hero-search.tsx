"use client";

import { Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SuggestResponse = {
  freelancers: Array<{ userId: string; name: string; headline: string | null }>;
  skills: Array<{ slug: string; name: string }>;
  categories: Array<{ slug: string; name: string }>;
};

export function HeroMarketplaceSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<SuggestResponse | null>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>();
  const wrapRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  React.useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetch(`/api/marketplace/search?q=${encodeURIComponent(term)}`)
        .then((r) => r.json())
        .then((json: SuggestResponse) => {
          setData(json);
          setOpen(true);
        })
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    }, 280);
    return () => clearTimeout(debounceRef.current);
  }, [q]);

  function goSearch(term?: string) {
    const t = (term ?? q).trim();
    if (!t) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(t)}`);
  }

  const empty = q.trim().length >= 2 && !loading && data &&
    !data.freelancers.length && !data.skills.length && !data.categories.length;

  return (
    <div ref={wrapRef} className={cn("relative w-full max-w-xl", className)}>
      <form
        className="relative"
        onSubmit={(e) => {
          e.preventDefault();
          goSearch();
        }}
        role="search"
        aria-label="Search marketplace"
      >
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q.trim().length >= 2 && setOpen(true)}
          placeholder="Search freelancers, skills, or categories…"
          className="h-12 rounded-xl border-border/80 bg-card/90 pl-11 pr-11 text-base shadow-subtle backdrop-blur"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="hero-search-suggestions"
        />
        {loading ? (
          <Loader2
            className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-label="Loading suggestions"
          />
        ) : null}
      </form>

      {open && q.trim().length >= 2 ? (
        <div
          id="hero-search-suggestions"
          role="listbox"
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-border/80 bg-card shadow-lg"
        >
          {empty ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No matches for &ldquo;{q.trim()}&rdquo;. Try another skill or browse{" "}
              <Link href="/freelancers" className="font-medium text-primary underline-offset-4 hover:underline">
                all freelancers
              </Link>
              .
            </p>
          ) : (
            <div className="max-h-72 overflow-y-auto p-2">
              {data?.skills.length ? (
                <section className="mb-2">
                  <p className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">Skills</p>
                  <ul>
                    {data.skills.map((s) => (
                      <li key={s.slug}>
                        <button
                          type="button"
                          role="option"
                          className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
                          onClick={() => goSearch(s.name)}
                        >
                          {s.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {data?.categories.length ? (
                <section className="mb-2">
                  <p className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">Categories</p>
                  <ul>
                    {data.categories.map((c) => (
                      <li key={c.slug}>
                        <Link
                          href={`/categories?slug=${c.slug}`}
                          className="block rounded-lg px-3 py-2 text-sm hover:bg-accent"
                          onClick={() => setOpen(false)}
                        >
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {data?.freelancers.length ? (
                <section>
                  <p className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">Freelancers</p>
                  <ul>
                    {data.freelancers.map((f) => (
                      <li key={f.userId}>
                        <Link
                          href={`/users/${f.userId}`}
                          className="block rounded-lg px-3 py-2 text-sm hover:bg-accent"
                          onClick={() => setOpen(false)}
                        >
                          <span className="font-medium">{f.name}</span>
                          {f.headline ? (
                            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                              {f.headline}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              <button
                type="button"
                className="mt-1 w-full rounded-lg border-t border-border/60 px-3 py-2.5 text-sm font-medium text-primary hover:bg-accent"
                onClick={() => goSearch()}
              >
                View all results for &ldquo;{q.trim()}&rdquo;
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
