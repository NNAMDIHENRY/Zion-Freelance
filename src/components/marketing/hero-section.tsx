import type { ReactNode } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HeroSectionProps = {
  badge?: string;
  title: string;
  description: string;
  primaryCta: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  className?: string;
  children?: ReactNode;
};

export function HeroSection({
  badge,
  title,
  description,
  primaryCta,
  secondaryCta,
  className,
  children
}: HeroSectionProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-violet-500/[0.07] via-background to-background",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -left-32 top-1/4 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 top-0 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-xl animate-fade-in-up">
            {badge ? (
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-3 py-1 text-xs font-medium text-foreground shadow-subtle backdrop-blur">
                <span
                  className="h-2 w-2 animate-pulse-soft rounded-full bg-emerald-500"
                  aria-hidden
                />
                {badge}
              </div>
            ) : null}
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.15rem] lg:leading-[1.1]">
              {title}
            </h1>
            <p className="mt-5 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              {description}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="rounded-xl px-6 shadow-subtle">
                <Link href={primaryCta.href}>{primaryCta.label}</Link>
              </Button>
              {secondaryCta ? (
                <Button asChild size="lg" variant="outline" className="rounded-xl px-6">
                  <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="relative min-h-[280px] lg:min-h-[340px]">{children}</div>
        </div>
      </div>
    </section>
  );
}

export function HeroIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-lg animate-fade-in lg:mx-0">
      <div className="absolute inset-0 animate-float rounded-[2rem] bg-gradient-to-br from-violet-600/30 via-transparent to-cyan-500/25 blur-xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card/90 p-6 shadow-subtle backdrop-blur">
        <div className="flex items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div className="flex gap-2">
            <span className="h-3 w-3 rounded-full bg-red-400/90" />
            <span className="h-3 w-3 rounded-full bg-amber-400/90" />
            <span className="h-3 w-3 rounded-full bg-emerald-400/90" />
          </div>
          <div className="h-2 flex-1 rounded-full bg-muted/80">
            <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" />
          </div>
        </div>
        <div className="mt-5 grid gap-3">
          {[1, 2, 3].map((row) => (
            <div
              key={row}
              className="flex items-center gap-3 rounded-xl bg-muted/40 p-3 ring-1 ring-border/40"
            >
              <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br from-violet-600/80 to-cyan-500/70" />
              <div className="min-w-0 flex-1 space-y-2">
                <div
                  className="h-2.5 w-3/5 rounded bg-foreground/10"
                  style={{ width: `${60 + row * 5}%` }}
                />
                <div className="h-2 w-full max-w-[85%] rounded bg-muted-foreground/15" />
              </div>
              <div className="hidden h-8 w-16 shrink-0 rounded-lg bg-emerald-500/15 text-center text-[10px] font-semibold leading-8 text-emerald-700 dark:text-emerald-400 sm:block">
                Active
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-xl border border-dashed border-border/70 bg-gradient-to-r from-violet-500/10 to-cyan-500/10 p-4 text-center text-xs font-medium text-muted-foreground">
          Secure milestones · Encrypted chat · Verified profiles
        </div>
      </div>
    </div>
  );
}
