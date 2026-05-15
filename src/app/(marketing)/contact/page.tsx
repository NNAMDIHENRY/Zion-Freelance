import type { Metadata } from "next";

import { ContactForm } from "@/components/marketing/contact-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Zion TeCHer for sales, partnerships, or product questions—submit the form or reach support via email."
};

export default function ContactPage() {
  return (
    <div className="border-b border-border/40 bg-gradient-to-b from-violet-500/[0.05] to-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
              Contact
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Let’s talk about your next launch.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Tell us about timelines, headcount, and hiring goals. For enterprise security reviews or
              procurement paperwork, note it in your message—we will route you to the right specialist.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <Card className="border-border/70 shadow-subtle">
                <CardContent className="p-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Email
                  </div>
                  <a
                    href="mailto:support@ziontecher.example"
                    className="mt-2 block text-sm font-semibold text-foreground underline-offset-4 hover:underline"
                  >
                    support@ziontecher.example
                  </a>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Replace with your production inbox via env when ready.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/70 shadow-subtle">
                <CardContent className="p-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Response time
                  </div>
                  <p className="mt-2 text-sm font-medium">Within one business day</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Enterprise inquiries are prioritized by dedicated success.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="border-border/70 shadow-subtle lg:mt-8">
            <CardContent className="p-6 sm:p-8">
              <h2 className="text-lg font-semibold">Send a message</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Fields marked required help us route your request faster.
              </p>
              <div className="mt-8">
                <ContactForm />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
