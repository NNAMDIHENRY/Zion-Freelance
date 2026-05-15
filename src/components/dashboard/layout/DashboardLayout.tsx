"use client";

import * as React from "react";

import type { Role } from "@prisma/client";

import { getMenuByRole } from "@/lib/dashboard/menu-config";
import { cn } from "@/lib/utils";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { DashboardModalProvider } from "../ui/Modal";

export type DashboardLayoutUser = {
  id: string;
  name: string | null | undefined;
  email: string | null | undefined;
  image: string | null | undefined;
  role: Role;
};

type DashboardLayoutProps = {
  children: React.ReactNode;
  user: DashboardLayoutUser;
};

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const menu = getMenuByRole(user.role);

  return (
    <DashboardModalProvider>
      <div className="flex min-h-screen bg-muted/15">
        <div className="hidden lg:flex">
          <Sidebar menu={menu} />
        </div>

        {mobileNavOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          />
        ) : null}

        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 max-w-[85vw] transition-transform duration-200 lg:hidden",
            mobileNavOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <Sidebar menu={menu} onNavigate={() => setMobileNavOpen(false)} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar user={user} onMenuClick={() => setMobileNavOpen(true)} />
          <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </DashboardModalProvider>
  );
}
