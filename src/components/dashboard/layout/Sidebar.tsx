"use client";

import Link from "next/link";

import type { DashboardNavItem } from "@/lib/dashboard/menu-config";
import { cn } from "@/lib/utils";

import { RoleBasedMenu } from "../navigation/RoleBasedMenu";

type SidebarProps = {
  menu: DashboardNavItem[];
  onNavigate?: () => void;
  className?: string;
};

export function Sidebar({ menu, onNavigate, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full w-64 shrink-0 flex-col border-r border-sky-200/70 bg-gradient-to-b from-sky-50 via-sky-50/95 to-sky-100/80 shadow-lg dark:border-sky-900/50 dark:from-slate-900 dark:via-slate-900/98 dark:to-slate-950 lg:backdrop-blur-sm",
        className
      )}
    >
      <div className="flex h-14 items-center border-b border-sky-200/60 px-4 dark:border-sky-900/40">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span
            className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 to-sky-700 shadow-subtle dark:from-sky-600 dark:to-sky-800"
            aria-hidden
          />
          <span className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-100">
            Zion Workspace
          </span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <RoleBasedMenu items={menu} onNavigate={onNavigate} />
      </div>
    </aside>
  );
}
