"use client";

import type { DashboardNavItem } from "@/lib/dashboard/menu-config";
import { UnreadMessagesBadge } from "@/components/messaging/UnreadMessagesBadge";

import { NavItem } from "./NavItem";

type RoleBasedMenuProps = {
  items: DashboardNavItem[];
  onNavigate?: () => void;
};

export function RoleBasedMenu({ items, onNavigate }: RoleBasedMenuProps) {
  return (
    <nav className="flex flex-col gap-1" aria-label="Workspace">
      {items.map((item) => (
        <NavItem
          key={item.href}
          item={item}
          onNavigate={onNavigate}
          trailing={
            item.href === "/dashboard/messages" ? (
              <UnreadMessagesBadge pollMs={22000} className="ml-1 translate-y-[1px]" />
            ) : undefined
          }
        />
      ))}
    </nav>
  );
}
