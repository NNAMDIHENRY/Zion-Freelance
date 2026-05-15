import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  Handshake,
  MessageCircle,
  PackageCheck,
  Rocket
} from "lucide-react";

import { FeatureSection } from "@/components/marketing";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Step-by-step workflow for posting projects, reviewing proposals, hiring talent, and collaborating securely on Zion TeCHer."
};

const phases = [
  {
    icon: ClipboardList,
    title: "Define outcomes",
    body: "Create a brief with goals, constraints, timeline, and budget band. Attach references or acceptance criteria so proposals align with what “done” means."
  },
  {
    icon: Rocket,
    title: "Publish & distribute",
    body: "Your listing reaches relevant freelancers—highlight tech stacks, industries, or engagement models (fixed price, hourly, hybrid)."
  },
  {
    icon: Handshake,
    title: "Evaluate proposals",
    body: "Compare scope, pricing, and delivery plans side by side. Shortlist candidates and ask clarifying questions without leaving the thread."
  },
  {
    icon: MessageCircle,
    title: "Contract & kickoff",
    body: "Confirm milestones, deposits, and communication norms. Everyone references the same agreement as work progresses."
  },
  {
    icon: PackageCheck,
    title: "Deliver & iterate",
    body: "Share files, review checkpoints, and approve releases. Feedback stays contextual—reducing rework and timeline risk."
  }
];

export default function HowItWorksPage() {
  return (
    <>
      <div className="border-b border-border/40 bg-gradient-to-br from-violet-500/[0.07] via-background to-cyan-500/[0.06]">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
              Workflow
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              A disciplined process your stakeholders can follow.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Whether you hire occasionally or run a dedicated bench, Zion TeCHer keeps intake,
              selection, and delivery in one coherent flow—so procurement, finance, and creatives stay
              aligned.
            </p>
          </div>
        </div>
      </div>

      <FeatureSection
        eyebrow="Inside the platform"
        title="Detailed workflow—from intake to delivery."
        description="Each stage builds on the last: clearer inputs produce sharper proposals, and sharper proposals yield predictable execution."
        align="left"
      >
        <div className="space-y-6">
          {phases.map((p, i) => (
            <Card key={p.title} className="border-border/70 shadow-subtle">
              <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:gap-8">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-subtle">
                  <p.icon className="h-6 w-6" aria-hidden />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Phase {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="mt-1 text-lg font-semibold">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-dashed border-border/80 bg-muted/25 p-8 text-center">
          <p className="text-sm font-medium">Ready to run your first project?</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-subtle hover:bg-primary/90"
            >
              Create account
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold hover:bg-accent"
            >
              Talk to sales
            </Link>
          </div>
        </div>
      </FeatureSection>
    </>
  );
}
