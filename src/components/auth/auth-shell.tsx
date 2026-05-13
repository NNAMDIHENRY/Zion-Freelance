import Link from "next/link";

import { cn } from "@/lib/utils";

export function AuthShell({
  title,
  subtitle,
  children,
  footer
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/40">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
      >
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-24 bottom-24 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12 sm:px-6">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2">
            <span className="h-10 w-10 rounded-xl bg-primary shadow-subtle" />
            <span className="text-left leading-tight">
              <span className="block text-sm font-semibold tracking-tight">
                Zion TeCHer
              </span>
              <span className="block text-xs text-muted-foreground">
                Freelance Marketplace
              </span>
            </span>
          </Link>
        </div>

        <div
          className={cn(
            "rounded-2xl border border-border/60 bg-card/80 p-6 shadow-subtle backdrop-blur",
            "sm:p-8"
          )}
        >
          <div className="mb-6 space-y-1 text-center sm:text-left">
            <h1 className="text-balance text-2xl font-semibold tracking-tight">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-pretty text-sm text-muted-foreground">
                {subtitle}
              </p>
            ) : null}
          </div>
          {children}
        </div>

        {footer ? (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
