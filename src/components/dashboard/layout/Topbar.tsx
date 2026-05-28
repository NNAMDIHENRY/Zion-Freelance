"use client";

import { Menu } from "lucide-react";

import { DashboardSearch } from "@/components/search/DashboardSearch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { NotificationDropdown } from "../ui/NotificationDropdown";
import type { ProfileDropdownUser } from "../ui/ProfileDropdown";
import { ProfileDropdown } from "../ui/ProfileDropdown";

type TopbarProps = {
  user: ProfileDropdownUser;
  onMenuClick: () => void;
};

export function Topbar({ user, onMenuClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-background/90 px-3 backdrop-blur-md sm:px-4">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open navigation"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="hidden min-w-0 flex-1 md:block">
        <DashboardSearch />
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <NotificationDropdown />
        <ProfileDropdown user={user} />
      </div>
    </header>
  );
}
