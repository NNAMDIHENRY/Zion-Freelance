"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type DropdownProps = {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
  className?: string;
  contentClassName?: string;
};

export function Dropdown({
  trigger,
  children,
  align = "end",
  className,
  contentClassName
}: DropdownProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
        role="presentation"
      >
        {trigger}
      </div>
      {open ? (
        <div
          className={cn(
            "absolute z-50 mt-2 min-w-[14rem] rounded-xl border border-border/60 bg-popover p-1 text-popover-foreground shadow-subtle animate-in fade-in-0 zoom-in-95",
            align === "end" ? "right-0" : "left-0",
            contentClassName
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
