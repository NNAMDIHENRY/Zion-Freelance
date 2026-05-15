"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { DashboardNavItem } from "@/lib/dashboard/menu-config";
import { cn } from "@/lib/utils";

type NavItemProps = {
  item: DashboardNavItem;
  onNavigate?: () => void;
};

export function NavItem({ item, onNavigate }: NavItemProps) {
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
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-foreground shadow-subtle"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
      <span>{item.label}</span>
    </Link>
  );
}
