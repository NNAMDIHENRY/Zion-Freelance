"use client";

import type { Session } from "next-auth";

import { LogoutButton } from "@/components/auth/logout-button";

export function DashboardSignOut({ session }: { session: Session }) {
  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right text-sm sm:block">
        <p className="font-medium leading-none">{session.user?.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {String(session.user?.role ?? "").replaceAll("_", " ")}
        </p>
      </div>
      <LogoutButton className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm hover:bg-muted" />
    </div>
  );
}
