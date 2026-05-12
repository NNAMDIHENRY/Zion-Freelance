import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems: Array<{ href: string; label: string }> = [
  { href: "#features", label: "Features" },
  { href: "#security", label: "Security" },
  { href: "#architecture", label: "Architecture" }
];

export function Navbar({ className }: { className?: string }) {
  return (
    <header className={cn("border-b border-border/60 bg-background/70 backdrop-blur", className)}>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary" aria-hidden />
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">
              Zion TeCHer
            </div>
            <div className="text-xs text-muted-foreground">
              Freelance Marketplace
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link href="/api/auth/signin">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/api/auth/signin">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

