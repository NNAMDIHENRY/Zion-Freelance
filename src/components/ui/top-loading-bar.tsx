"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

export function TopLoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    setActive(true);
    setProgress(12);
    const t1 = window.setTimeout(() => setProgress(55), 120);
    const t2 = window.setTimeout(() => setProgress(88), 280);
    const t3 = window.setTimeout(() => {
      setProgress(100);
      window.setTimeout(() => {
        setActive(false);
        setProgress(0);
      }, 220);
    }, 420);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [pathname, searchParams]);

  React.useEffect(() => {
    const onStart = () => {
      setActive(true);
      setProgress(20);
    };
    const onDone = () => {
      setProgress(100);
      window.setTimeout(() => {
        setActive(false);
        setProgress(0);
      }, 200);
    };
    window.addEventListener("zion:loading:start", onStart);
    window.addEventListener("zion:loading:done", onDone);
    return () => {
      window.removeEventListener("zion:loading:start", onStart);
      window.removeEventListener("zion:loading:done", onDone);
    };
  }, []);

  if (!active && progress === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 bg-transparent"
      role="progressbar"
      aria-hidden
    >
      <div
        className={cn(
          "h-full bg-gradient-to-r from-violet-600 via-cyan-500 to-violet-600 transition-[width] duration-200 ease-out shadow-[0_0_12px_rgba(124,58,237,0.45)]"
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export function signalLoadingStart() {
  window.dispatchEvent(new Event("zion:loading:start"));
}

export function signalLoadingDone() {
  window.dispatchEvent(new Event("zion:loading:done"));
}
