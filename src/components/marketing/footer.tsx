import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { FooterAccountLinks } from "./footer-account-links";
import { marketingNav } from "./nav-links";

export function Footer({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "border-t border-border/60 bg-gradient-to-b from-muted/30 to-background",
        className
      )}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500"
                aria-hidden
              />
              <div className="leading-tight">
                <div className="text-sm font-semibold tracking-tight">Zion TeCHer</div>
                <div className="text-xs text-muted-foreground">Freelance marketplace</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A premium global marketplace where clients find vetted talent and freelancers
              build sustainable businesses—with contracts, messaging, and secure collaboration.
            </p>
          </div>

          <div>
            <div className="text-sm font-semibold">Product</div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {marketingNav.map((l) => (
                <li key={l.href}>
                  <Link className="hover:text-foreground" href={l.href}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold">Account</div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <FooterAccountLinks />
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold">Legal</div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link className="hover:text-foreground" href="/terms">
                  Terms of service
                </Link>
              </li>
              <li>
                <Link className="hover:text-foreground" href="/privacy">
                  Privacy policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border/60 pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Zion TeCHer. All rights reserved.</p>
          <p className="text-[11px] sm:max-w-md sm:text-right">
            Built for speed, trust, and global collaboration.
          </p>
        </div>
      </div>
    </footer>
  );
}

export function FooterCta() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <div className="overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-violet-600/10 via-background to-cyan-500/10 p-8 shadow-subtle sm:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Ready to hire or get hired?
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
              Join a platform designed for serious work—clear scope, safe collaboration, and
              quality outcomes.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">
            <Button asChild size="lg" className="rounded-xl">
              <Link href="/auth/register">Get started</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl">
              <Link href="/contact">Talk to us</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
