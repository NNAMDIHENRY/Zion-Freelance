import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  MessageSquare,
  Shield,
  Sparkles,
  Users
} from "lucide-react";

import {
  FAQAccordion,
  FeatureSection,
  FooterCta,
  HeroIllustration,
  HeroSection,
  PricingCards,
  TestimonialSection,
  defaultPricingTiers
} from "@/components/marketing";
import { Card, CardContent } from "@/components/ui/card";
import { marketingFaqItems } from "@/lib/marketing/faq-items";

export const metadata: Metadata = {
  title: "Hire global talent with confidence",
  description:
    "Post projects, compare proposals, and hire vetted freelancers across design, development, writing, marketing, and more—built for secure collaboration."
};

const testimonials = [
  {
    quote:
      "We replaced chaotic inbox hiring with structured proposals. Our last three launches shipped on time.",
    name: "Jordan Lee",
    role: "Head of Product",
    org: "Northwind Labs"
  },
  {
    quote:
      "Clear milestones and messaging meant fewer surprises. Freelancers on Zion TeCHer behave like true partners.",
    name: "Priya Desai",
    role: "Operations Director",
    org: "Harbor Studio"
  },
  {
    quote:
      "As a designer, I close better clients because expectations are documented up front—no more scope drift.",
    name: "Marcus Cole",
    role: "Independent Designer",
    org: "Cole Visual"
  }
];

const categories = [
  {
    title: "Design",
    desc: "Brand, UI/UX, illustration",
    icon: Sparkles
  },
  {
    title: "Development",
    desc: "Web, mobile, infrastructure",
    icon: BadgeCheck
  },
  {
    title: "Writing",
    desc: "Copy, technical, editorial",
    icon: MessageSquare
  },
  {
    title: "Marketing",
    desc: "Growth, SEO, lifecycle",
    icon: Users
  },
  {
    title: "Video editing",
    desc: "Social, ads, motion",
    icon: Clock
  },
  {
    title: "Business support",
    desc: "Ops, research, admin",
    icon: Shield
  }
];

const workflow = [
  {
    step: "01",
    title: "Post your project",
    body: "Describe outcomes, timeline, and budget—structured briefs attract stronger proposals."
  },
  {
    step: "02",
    title: "Receive proposals",
    body: "Compare portfolios, pricing, and delivery plans side by side without inbox chaos."
  },
  {
    step: "03",
    title: "Hire top talent",
    body: "Lock scope with milestones and clear acceptance criteria before work begins."
  },
  {
    step: "04",
    title: "Collaborate securely",
    body: "Chat, files, and approvals stay attached to the engagement for everyone."
  }
];

const freelancers = [
  {
    name: "Amelia Hart",
    role: "Product Designer",
    rate: "$95/hr",
    metric: "Product UI · Design systems"
  },
  {
    name: "David Okonkwo",
    role: "Full-stack Engineer",
    rate: "$110/hr",
    metric: "Next.js · APIs · Postgres"
  },
  {
    name: "Sofia Reyes",
    role: "Growth Marketer",
    rate: "$85/hr",
    metric: "Paid media · Lifecycle"
  },
  {
    name: "Chen Wei",
    role: "Video Editor",
    rate: "$70/hr",
    metric: "Motion · Social campaigns"
  }
];

export default function HomePage() {
  return (
    <>
      <HeroSection
        badge="Trusted by teams shipping worldwide"
        title="The premium marketplace for serious client work."
        description="Post crystal-clear projects, compare standout proposals, and collaborate with confidence—structured workflows built for outcomes, not chaos."
        primaryCta={{ href: "/auth/register", label: "Start hiring" }}
        secondaryCta={{ href: "/how-it-works", label: "See how it works" }}
      >
        <HeroIllustration />
      </HeroSection>

      <section className="border-b border-border/40 bg-muted/15 py-12 sm:py-14">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {["SOC2-ready posture*", "Encrypted sessions", "Role-based access", "AML-aware payouts*"].map(
              (label) => (
                <span
                  key={label}
                  className="rounded-full border border-border/70 bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-subtle"
                >
                  {label}
                </span>
              )
            )}
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { label: "Talent profiles indexed", value: "12k+", hint: "Across core categories" },
              { label: "Median proposal turnaround", value: "48h", hint: "After brief approval*" },
              { label: "Quality satisfaction", value: "4.9 / 5", hint: "Post-project surveys*" }
            ].map((m) => (
              <Card key={m.label} className="border-border/70 text-center shadow-subtle">
                <CardContent className="p-6">
                  <div className="text-3xl font-semibold tracking-tight">{m.value}</div>
                  <div className="mt-2 text-sm font-medium">{m.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{m.hint}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-[11px] text-muted-foreground">
            *Illustrative metrics for marketing; wire your analytics when modules go live.
          </p>
        </div>
      </section>

      <FeatureSection
        eyebrow="Categories"
        title="Every discipline your roadmap demands."
        description="Curated lanes help buyers move faster—whether you need pixels, code, narrative, or growth."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Link key={c.title} href="/categories" className="group">
              <Card className="h-full border-border/70 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-violet-500/35 group-hover:shadow-md">
                <CardContent className="flex gap-4 p-6">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/90 to-cyan-500/80 text-white shadow-subtle">
                    <c.icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <div className="font-semibold">{c.title}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </FeatureSection>

      <section className="border-y border-border/50 bg-gradient-to-br from-violet-500/[0.06] via-background to-cyan-500/[0.05] py-16 sm:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
              Workflow
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              From brief to delivered—without losing the plot.
            </h2>
          </div>
          <ol className="mt-12 grid gap-6 md:grid-cols-2">
            {workflow.map((w) => (
              <li key={w.step}>
                <Card className="h-full border-border/70 bg-card/90 backdrop-blur">
                  <CardContent className="p-6 sm:p-7">
                    <div className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
                      Step {w.step}
                    </div>
                    <h3 className="mt-3 text-lg font-semibold">{w.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{w.body}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex justify-center">
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 underline-offset-4 hover:underline dark:text-violet-300"
            >
              Explore the full workflow
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <FeatureSection
        eyebrow="Talent spotlight"
        title="Featured freelancers"
        description="Preview the caliber of partners available—profiles emphasize outcomes, tech stacks, and engagement style."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {freelancers.map((f) => (
            <Card key={f.name} className="border-border/70 shadow-subtle">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 text-sm font-bold text-white shadow-subtle">
                    {f.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{f.name}</div>
                    <div className="text-xs text-muted-foreground">{f.role}</div>
                  </div>
                </div>
                <div className="mt-4 text-sm font-semibold text-violet-700 dark:text-violet-300">
                  {f.rate}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{f.metric}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </FeatureSection>

      <TestimonialSection
        title="Leaders trust the process."
        description="Teams adopt Zion TeCHer when delivery discipline matters as much as talent density."
        items={testimonials}
      />

      <FeatureSection
        eyebrow="Pricing"
        title="Predictable plans that scale with your hiring cadence."
        description="Start free, upgrade when you need visibility and premium collaboration tooling."
      >
        <PricingCards tiers={defaultPricingTiers} />
        <div className="mt-10 flex justify-center">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-sm font-semibold text-foreground underline-offset-4 hover:underline"
          >
            Compare plans in detail
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </FeatureSection>

      <section className="py-16 sm:py-20 lg:py-24">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Questions, answered</h2>
            <p className="mt-4 text-muted-foreground sm:text-lg">
              Straightforward responses on pricing, security, and how we keep engagements aligned.
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-3xl">
            <FAQAccordion items={marketingFaqItems.slice(0, 4)} />
            <div className="mt-8 text-center">
              <Link
                href="/faq"
                className="text-sm font-semibold text-violet-700 underline-offset-4 hover:underline dark:text-violet-300"
              >
                View all FAQs
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20 pt-4 sm:pb-24">
        <FooterCta />
      </section>
    </>
  );
}
