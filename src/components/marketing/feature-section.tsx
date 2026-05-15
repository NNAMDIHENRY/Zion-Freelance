import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type FeatureSectionProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  align?: "center" | "left";
};

export function FeatureSection({
  eyebrow,
  title,
  description,
  children,
  className,
  align = "center"
}: FeatureSectionProps) {
  const isCenter = align === "center";
  return (
    <section className={cn("py-16 sm:py-20 lg:py-24", className)}>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div
          className={cn(
            "mb-10 max-w-2xl sm:mb-12",
            isCenter ? "mx-auto text-center" : "text-left"
          )}
        >
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
              {description}
            </p>
          ) : null}
        </div>
        {children}
      </div>
    </section>
  );
}
