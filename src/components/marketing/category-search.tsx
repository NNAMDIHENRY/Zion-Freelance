"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type CategoryCard = {
  slug: string;
  title: string;
  description: string;
  tags: string[];
};

export const serviceCategories: CategoryCard[] = [
  {
    slug: "design",
    title: "Design",
    description:
      "Brand systems, UI/UX, illustrations, and presentation design from specialists who ship polished visuals.",
    tags: ["Brand", "UI/UX", "Illustration"]
  },
  {
    slug: "development",
    title: "Development",
    description:
      "Full-stack engineers, mobile developers, and DevOps talent for resilient products at any scale.",
    tags: ["Web", "Mobile", "Cloud"]
  },
  {
    slug: "writing",
    title: "Writing",
    description:
      "Copywriters, technical writers, and editors who clarify messaging and drive conversions.",
    tags: ["Marketing copy", "Technical", "Editing"]
  },
  {
    slug: "marketing",
    title: "Marketing",
    description:
      "Growth strategists, SEO experts, paid media, and lifecycle marketers focused on measurable outcomes.",
    tags: ["SEO", "Paid media", "Lifecycle"]
  },
  {
    slug: "video-editing",
    title: "Video editing",
    description:
      "Editors and motion designers producing social clips, explainers, ads, and long-form stories.",
    tags: ["Social", "Ads", "Motion"]
  },
  {
    slug: "business-support",
    title: "Business support",
    description:
      "Ops, virtual assistants, finance support, and research specialists who keep teams moving.",
    tags: ["Operations", "Research", "Admin"]
  }
];

export function CategorySearchGrid({ className }: { className?: string }) {
  const [q, setQ] = React.useState("");

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return serviceCategories;
    return serviceCategories.filter((c) => {
      const hay = `${c.title} ${c.description} ${c.tags.join(" ")}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [q]);

  return (
    <div className={cn("space-y-8", className)}>
      <div className="relative mx-auto max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search categories, skills, or keywords..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-12 rounded-xl border-border/80 pl-10 shadow-subtle"
          aria-label="Search categories"
        />
      </div>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <li key={c.slug} id={c.slug}>
            <Link href={`/categories#${c.slug}`} className="group block h-full">
              <Card className="h-full border-border/70 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-violet-500/35 group-hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">{c.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {c.description}
                  </CardDescription>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {c.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
      {filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          No categories match &ldquo;{q}&rdquo;. Try design, development, or marketing.
        </p>
      ) : null}
    </div>
  );
}
