"use client";

import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Dropdown } from "./Dropdown";

const MOCK_NOTIFICATIONS = [
  { id: "1", title: "Proposal viewed", body: "A client opened your proposal for Brand refresh.", time: "2h" },
  { id: "2", title: "Milestone reminder", body: "Deliverable due tomorrow for Website rebuild.", time: "5h" },
  { id: "3", title: "New message", body: "You have a new thread in Project Atlas.", time: "1d" }
];

export function NotificationDropdown() {
  return (
    <Dropdown
      align="end"
      trigger={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-lg border border-transparent hover:border-border/60 hover:bg-accent"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" aria-hidden />
        </Button>
      }
      contentClassName="min-w-[20rem] p-0 overflow-hidden"
    >
      <div className="border-b border-border/60 px-4 py-3">
        <p className="text-sm font-semibold">Notifications</p>
        <p className="text-xs text-muted-foreground">Preview data — wiring comes later.</p>
      </div>
      <ul className="max-h-72 overflow-y-auto py-1">
        {MOCK_NOTIFICATIONS.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              className={cn(
                "flex w-full flex-col gap-0.5 px-4 py-3 text-left text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <span className="font-medium leading-tight">{n.title}</span>
              <span className="text-xs text-muted-foreground">{n.body}</span>
              <span className="text-[11px] text-muted-foreground/80">{n.time} ago</span>
            </button>
          </li>
        ))}
      </ul>
    </Dropdown>
  );
}
