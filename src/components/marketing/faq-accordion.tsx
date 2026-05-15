"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type FaqItem = {
  question: string;
  answer: string;
};

type FAQAccordionProps = {
  items: FaqItem[];
  className?: string;
};

export function FAQAccordion({ items, className }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  return (
    <div
      className={cn(
        "divide-y divide-border/70 rounded-2xl border border-border/70 bg-card",
        className
      )}
    >
      {items.map((item, index) => {
        const open = openIndex === index;
        const id = `faq-panel-${index}`;
        const btnId = `faq-trigger-${index}`;
        return (
          <div key={item.question} className="px-1">
            <button
              type="button"
              id={btnId}
              aria-expanded={open}
              aria-controls={id}
              className="flex w-full items-center justify-between gap-4 rounded-xl px-4 py-4 text-left text-sm font-semibold transition-colors hover:bg-muted/50 sm:px-5 sm:text-base"
              onClick={() => setOpenIndex(open ? null : index)}
            >
              <span className="text-balance">{item.question}</span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
                  open && "rotate-180"
                )}
                aria-hidden
              />
            </button>
            <div
              id={id}
              role="region"
              aria-labelledby={btnId}
              className={cn(
                "grid transition-[grid-template-rows] duration-200 ease-out",
                open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground sm:px-5">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
