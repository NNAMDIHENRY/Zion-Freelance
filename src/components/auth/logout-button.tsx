"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  className?: string;
  label?: string;
};

export function LogoutButton({ className, label = "Sign out" }: LogoutButtonProps) {
  return (
    <button
      type="button"
      className={cn(className)}
      onClick={() => void signOut({ callbackUrl: "/" })}
    >
      <LogOut className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </button>
  );
}
