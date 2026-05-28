"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { DashboardNavItem } from "@/lib/dashboard/menu-config";
import { cn } from "@/lib/utils";

type NavItemProps = {
  item: DashboardNavItem;
  onNavigate?: () => void;
  trailing?: ReactNode;
};

export function NavItem({ item, onNavigate, trailing }: NavItemProps) {
  const pathname = usePathname();
  const Icon = item.icon;
  const active =
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50",
        active
          ? "bg-sky-600 text-white shadow-md shadow-sky-600/25 dark:bg-sky-600 dark:text-white"
          : "text-slate-600 hover:bg-sky-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-sky-950/60 dark:hover:text-slate-100"
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", active ? "opacity-100" : "opacity-75")} aria-hidden />
      <span className="min-w-0 flex-1">{item.label}</span>
      {trailing ? (
        <span className="shrink-0" onClick={(e) => e.preventDefault()} role="presentation">
          {trailing}
        </span>
      ) : null}
    </Link>
  );
}
