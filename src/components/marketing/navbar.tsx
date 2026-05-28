"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Bell, LayoutDashboard, Menu, MessageSquare, X } from "lucide-react";

import { ProfileDropdown } from "@/components/dashboard/ui/ProfileDropdown";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { marketingNav } from "./nav-links";

export function Navbar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [open, setOpen] = React.useState(false);

  const navActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const authed = status === "authenticated" && session?.user;

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
        "sticky top-0 z-50 border-b border-sky-200 bg-gradient-to-r from-sky-100 via-blue-50 to-cyan-100 backdrop-blur-md",
        className
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:h-[4.25rem] sm:px-6">
        <Link href="/" className="group flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-secondary shadow-subtle transition-transform group-hover:scale-[1.02]"
            aria-hidden
          />
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight text-slate-800">Zion Workspace</div>
            <div className="text-xs text-slate-600">Freelance marketplace</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Primary">
          {marketingNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-all",
                navActive(item.href)
                  ? "bg-white/90 text-slate-900 shadow-sm ring-1 ring-sky-200/80"
                  : "text-slate-700 hover:bg-white/70 hover:text-slate-900"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {authed ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex">
                <Link href="/dashboard/messages" aria-label="Messages">
                  <MessageSquare className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex">
                <Link href="/dashboard/notifications" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                </Link>
              </Button>
              <ProfileDropdown user={session.user} />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button asChild className="hidden rounded-xl sm:inline-flex">
                <Link href="/auth/register">Get started</Link>
              </Button>
            </>
          )}

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-sky-200 bg-white/70 text-slate-700 shadow-sm md:hidden"
            aria-expanded={open}
            aria-controls="marketing-mobile-drawer"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        id="marketing-mobile-drawer"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-sky-200/70 bg-gradient-to-b from-sky-50 via-sky-50/98 to-sky-100 shadow-xl transition-transform duration-200 md:hidden",
          open ? "translate-x-0" : "-translate-x-full pointer-events-none"
        )}
        aria-hidden={!open}
      >
        <div className="flex h-14 items-center justify-between border-b border-sky-200/60 px-4">
          <span className="text-sm font-semibold text-slate-800">Menu</span>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-white/80"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Mobile">
          <ul className="space-y-1">
            {marketingNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    navActive(item.href)
                      ? "bg-white text-slate-900 shadow-sm ring-1 ring-sky-200"
                      : "text-slate-700 hover:bg-white/80"
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-2 border-t border-sky-200/60 pt-4">
            {authed ? (
              <>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/dashboard" onClick={() => setOpen(false)}>
                    Dashboard
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/dashboard/messages" onClick={() => setOpen(false)}>
                    Messages
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start">
                  <Link href="/dashboard/profile" onClick={() => setOpen(false)}>
                    Profile
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/auth/login" onClick={() => setOpen(false)}>
                    Sign in
                  </Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/auth/register" onClick={() => setOpen(false)}>
                    Get started
                  </Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      </aside>
    </header>
  );
}
