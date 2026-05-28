"use client";

import { Suspense } from "react";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

import { TopLoadingBar } from "@/components/ui/top-loading-bar";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Suspense fallback={null}>
        <TopLoadingBar />
      </Suspense>
      {children}
      <Toaster richColors position="top-right" closeButton />
    </SessionProvider>
  );
}
