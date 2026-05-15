import type { Metadata } from "next";

import { CategorySearchGrid } from "@/components/marketing/category-search";

export const metadata: Metadata = {
  title: "Categories",
  description:
    "Explore freelance categories—design, development, writing, marketing, video editing, business support—and find the right specialists faster."
};

export default function CategoriesPage() {
  return (
    <div className="border-b border-border/40 bg-gradient-to-b from-background to-muted/15">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
            Marketplace
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Browse talent by craft—not keyword luck.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Search across disciplines and skills. Each category highlights common tags so you can
            route work to experts who match your stack and stage.
          </p>
        </div>

        <div className="mt-14">
          <CategorySearchGrid />
        </div>
      </div>
    </div>
  );
}
