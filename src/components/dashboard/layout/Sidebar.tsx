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
        "flex h-full w-64 shrink-0 flex-col border-r border-border/60 bg-card/80 backdrop-blur-sm",
        className
      )}
    >
      <div className="flex h-14 items-center border-b border-border/60 px-4">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="h-8 w-8 rounded-lg bg-primary shadow-subtle" aria-hidden />
          <span className="text-sm font-semibold tracking-tight">Zion Workspace</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <RoleBasedMenu items={menu} onNavigate={onNavigate} />
      </div>
    </aside>
  );
}
