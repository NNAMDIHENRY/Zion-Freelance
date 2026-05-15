import type { Metadata } from "next";

import { FAQAccordion } from "@/components/marketing";
import { marketingFaqItems } from "@/lib/marketing/faq-items";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about Zion TeCHer pricing, security, hiring workflow, and enterprise options."
};

export default function FaqPage() {
  return (
    <div className="border-b border-border/40 bg-gradient-to-b from-background to-muted/10">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
            Help center
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Answers for buyers and freelancers.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Straightforward guidance on how Zion TeCHer works today—and how upcoming modules will
            deepen payments, escrow, and admin controls.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <FAQAccordion items={marketingFaqItems} />
        </div>
      </div>
    </div>
  );
}
