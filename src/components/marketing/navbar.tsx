"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { marketingNav } from "./nav-links";

export function Navbar({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/65",
        className
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:h-[4.25rem] sm:px-6">
        <Link href="/" className="group flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 shadow-subtle transition-transform group-hover:scale-[1.02]"
            aria-hidden
          />
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Zion TeCHer</div>
            <div className="text-xs text-muted-foreground">Freelance marketplace</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Primary">
          {marketingNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/auth/login">Sign in</Link>
          </Button>
          <Button asChild className="hidden rounded-xl sm:inline-flex">
            <Link href="/auth/register">Get started</Link>
          </Button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/80 bg-background text-foreground transition-colors hover:bg-accent md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={cn(
          "fixed inset-0 top-16 z-40 bg-background/95 backdrop-blur-md transition-[opacity,visibility] duration-200 md:hidden",
          open ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"
        )}
        aria-hidden={!open}
      >
        <nav
          className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6"
          aria-label="Mobile"
        >
          {marketingNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-accent"
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4">
            <Button asChild variant="outline" className="w-full rounded-xl">
              <Link href="/auth/login" onClick={() => setOpen(false)}>
                Sign in
              </Link>
            </Button>
            <Button asChild className="w-full rounded-xl">
              <Link href="/auth/register" onClick={() => setOpen(false)}>
                Get started
              </Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
