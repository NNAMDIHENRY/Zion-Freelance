"use client";

import { Role } from "@prisma/client";
import { useSession } from "next-auth/react";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

const STEPS: Record<"CLIENT" | "FREELANCER", string[]> = {
  CLIENT: [
    "Post a clear project with budget and timeline.",
    "Compare proposals and verify freelancer profiles.",
    "Fund milestones before work starts for safer delivery."
  ],
  FREELANCER: [
    "Complete your profile and showcase portfolio work.",
    "Send tailored proposals with realistic delivery plans.",
    "Deliver milestones on time and request reviews after completion."
  ]
};

export function TutorialCoach() {
  const { data: session } = useSession();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  const role = session?.user?.role;
  const key =
    role === Role.CLIENT
      ? "tutorial_client_done"
      : role === Role.FREELANCER
        ? "tutorial_freelancer_done"
        : null;

  useEffect(() => {
    if (!key || typeof window === "undefined") return;
    if (localStorage.getItem(key) === "1") return;
    setVisible(true);
  }, [key]);

  if (!visible || !key || (role !== Role.CLIENT && role !== Role.FREELANCER)) return null;

  const lines = STEPS[role];
  const line = lines[step] ?? lines[0];

  function dismiss() {
    if (key) localStorage.setItem(key, "1");
    void fetch("/api/profile/tutorial", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ role })
    }).catch(() => undefined);
    setVisible(false);
  }

  return (
    <div className="rounded-2xl border border-violet-500/25 bg-gradient-to-r from-violet-500/10 to-cyan-500/10 p-4 shadow-subtle">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
            Quick walkthrough · Step {step + 1}/{lines.length}
          </p>
          <p className="mt-2 text-sm">{line}</p>
        </div>
        <button type="button" aria-label="Dismiss tutorial" onClick={dismiss}>
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {step < lines.length - 1 ? (
          <button
            type="button"
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            onClick={() => setStep((s) => s + 1)}
          >
            Next
          </button>
        ) : null}
        <button type="button" className="rounded-lg border px-3 py-1.5 text-xs" onClick={dismiss}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
