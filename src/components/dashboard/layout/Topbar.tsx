"use client";

import { Menu, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

      <div className="relative hidden min-w-0 flex-1 md:block md:max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          placeholder="Search projects, people, invoices…"
          className={cn(
            "h-10 w-full rounded-lg border-border/60 bg-muted/40 pl-9",
            "placeholder:text-muted-foreground/70"
          )}
          readOnly
          aria-readonly
          title="Search is coming in a later module"
        />
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <NotificationDropdown />
        <ProfileDropdown user={user} />
      </div>
    </header>
  );
}
