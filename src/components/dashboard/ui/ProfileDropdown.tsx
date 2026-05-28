"use client";

import Image from "next/image";
import Link from "next/link";
import { Settings, User } from "lucide-react";
import type { Role } from "@prisma/client";

import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Dropdown } from "./Dropdown";

export type ProfileDropdownUser = {
  name?: string | null | undefined;
  email?: string | null | undefined;
  image?: string | null | undefined;
  role: Role;
};

function roleLabel(role: Role) {
  return String(role).replaceAll("_", " ");
}

type ProfileDropdownProps = {
  user: ProfileDropdownUser;
};

export function ProfileDropdown({ user }: ProfileDropdownProps) {
  const initials =
    user.name
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "U";

  return (
    <Dropdown
      align="end"
      trigger={
        <Button
          type="button"
          variant="ghost"
          className="h-10 gap-2 rounded-full border border-border/60 px-1.5 pr-3 hover:bg-accent"
          aria-label="Account menu"
        >
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {user.image ? (
              <Image
                src={user.image}
                alt=""
                width={32}
                height={32}
                unoptimized
                className="h-8 w-8 object-cover"
              />
            ) : (
              initials
            )}
          </span>
          <span className="hidden max-w-[10rem] truncate text-left text-sm font-medium sm:block">
            {user.name ?? user.email ?? "Account"}
          </span>
        </Button>
      }
      contentClassName="min-w-[15rem] p-0 overflow-hidden"
    >
      <div className="border-b border-border/60 px-4 py-3">
        <p className="truncate text-sm font-semibold">{user.name ?? "Member"}</p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {roleLabel(user.role)}
        </p>
      </div>
      <div className="p-1">
        <Link
          href="/dashboard/profile"
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm",
            "hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <User className="h-4 w-4" aria-hidden />
          Profile
        </Link>
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm",
            "hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Settings className="h-4 w-4" aria-hidden />
          Settings
        </Link>
      </div>
      <div className="border-t border-border/60 p-1">
        <LogoutButton
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive",
            "hover:bg-destructive/10"
          )}
        />
      </div>
    </Dropdown>
  );
}
