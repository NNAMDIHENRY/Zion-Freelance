"use client";

import type { DashboardNavItem } from "@/lib/dashboard/menu-config";

import { NavItem } from "./NavItem";

type RoleBasedMenuProps = {
  items: DashboardNavItem[];
  onNavigate?: () => void;
};

export function RoleBasedMenu({ items, onNavigate }: RoleBasedMenuProps) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Workspace">
      {items.map((item) => (
        <NavItem key={item.href} item={item} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}
