"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export function CollapsibleFilters({
  title = "Filters",
  children,
  className
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={cn("space-y-3", className)}>
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-card px-4 py-3 text-sm font-semibold md:hidden"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {title}
        <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
      </button>
      <div className={cn("md:block", open ? "block" : "hidden md:block")}>{children}</div>
    </div>
  );
}
