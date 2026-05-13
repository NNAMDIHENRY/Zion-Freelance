"use client";

import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

export function DashboardSignOut({ session }: { session: Session }) {
  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right text-sm sm:block">
        <div className="font-medium leading-none">{session.user?.name}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {String(session.user?.role ?? "").replaceAll("_", " ")}
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => void signOut({ callbackUrl: "/" })}
      >
        <LogOut className="h-4 w-4" aria-hidden />
        Sign out
      </Button>
    </div>
  );
}
