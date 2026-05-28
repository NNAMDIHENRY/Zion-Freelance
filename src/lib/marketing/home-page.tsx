import Link from "next/link";
import Image from "next/image";
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
  TestimonialSection
} from "@/components/marketing";
import { getMarketingPricingTiers } from "@/lib/subscriptions/marketing-pricing";
import { HeroMarketplaceSearch } from "@/components/marketing/hero-search";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { Card, CardContent } from "@/components/ui/card";
import { marketingFaqItems } from "@/lib/marketing/faq-items";
import { PlatformPopup } from "@/components/marketing/PlatformPopup";
import { getActivePlatformPopup } from "@/lib/marketing/popup";
import { getFeaturedFreelancers, getMarketingStats } from "@/lib/marketing/stats";
import { JobsHomeSections } from "@/components/jobs/JobsHomeSections";
import { getSession } from "@/lib/auth/session";

const categories = [
  { title: "Design", desc: "Brand, UI/UX, illustration", icon: Sparkles },
  { title: "Development", desc: "Web, mobile, infrastructure", icon: BadgeCheck },
  { title: "Writing", desc: "Copy, technical, editorial", icon: MessageSquare },
  { title: "Marketing", desc: "Growth, SEO, lifecycle", icon: Users },
  { title: "Video editing", desc: "Social, ads, motion", icon: Clock },
  { title: "Business support", desc: "Ops, research, admin", icon: Shield }
];

const workflow = [
  {
    step: "01",
    title: "Post your project",
    body: "Describe outcomes, timeline, and budget."
  },
  {
    step: "02",
    title: "Receive proposals",
    body: "Compare portfolios, pricing, and delivery plans."
  },
  {
    step: "03",
    title: "Hire top talent",
    body: "Lock scope with milestones before work begins."
  },
  {
    step: "04",
    title: "Collaborate securely",
    body: "Chat, files, and approvals stay on the contract."
  }
];

const testimonials = [
  {
    quote: "Structured proposals and milestone funding replaced our hiring spreadsheet.",
    name: "Jordan Lee",
    role: "Head of Product",
    org: "Northwind Labs"
  },
  {
    quote: "Escrow and messaging kept our distributed team aligned on deliverables.",
    name: "Priya Desai",
    role: "Operations Director",
    org: "Harbor Studio"
  },
  {
    quote: "My portfolio and reviews help clients understand my work upfront.",
    name: "Marcus Cole",
    role: "Independent Designer",
    org: "Cole Visual"
  }
];

const QUOTES = [
  "Small consistent steps compound into remarkable outcomes.",
  "Clarity in scope protects both trust and delivery.",
  "Your next milestone is closer than it feels."
];

export async function MarketingHomePage() {
  const session = await getSession();
  const [stats, featured, popup] = await Promise.all([
    getMarketingStats(),
    getFeaturedFreelancers(4),
    getActivePlatformPopup(session?.user?.id)
  ]);
  const quote = QUOTES[new Date().getDate() % QUOTES.length];

  const statCards = [
    { label: "Freelancers", value: stats.freelancers.toLocaleString(), hint: "Public profiles" },
    { label: "Clients", value: stats.clients.toLocaleString(), hint: "Hiring on platform" },
    { label: "Active projects", value: stats.activeProjects.toLocaleString(), hint: "Open or in progress" },
    { label: "Completed projects", value: stats.completedProjects.toLocaleString(), hint: "Successfully delivered" },
    { label: "Verified users", value: stats.verifiedUsers.toLocaleString(), hint: "Identity verified" }
  ];

  return (
    <>
      {popup ? <PlatformPopup popup={popup} /> : null}
      <HeroSection
        badge="Live marketplace"
        title={
          session?.user?.name
            ? `Welcome back, ${session.user.name.split(" ")[0]}`
            : "Hire vetted freelancers with milestone-backed contracts."
        }
        description={
          session?.user
            ? `${quote} Explore live opportunities and keep momentum on your goals.`
            : "Post projects for free, compare real proposals, fund escrow by milestone, and collaborate in one workspace."
        }
        primaryCta={{ href: "/auth/register", label: "Start hiring" }}
        secondaryCta={{ href: "/freelancers", label: "Browse talent" }}
        search={<HeroMarketplaceSearch />}
      >
        <HeroIllustration />
      </HeroSection>

      <section className="border-b border-border/40 bg-muted/15 py-12 sm:py-14">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {statCards.map((m) => (
              <Card key={m.label} className="border-border/70 text-center shadow-subtle transition hover:border-violet-500/30 hover:shadow-md">
                <CardContent className="p-5 sm:p-6">
                  <div className="text-2xl font-semibold tracking-tight sm:text-3xl">{m.value}</div>
                  <div className="mt-2 text-sm font-medium">{m.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{m.hint}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Average freelancer rating: <span className="font-semibold text-foreground">{stats.avgRating} / 5</span>
          </p>
        </div>
      </section>

      <FeatureSection eyebrow="Categories" title="Every discipline your roadmap demands." description="Curated lanes for faster hiring.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Link key={c.title} href="/categories" className="group">
              <Card className="h-full border-border/70 transition hover:border-violet-500/35">
                <CardContent className="flex gap-4 p-6">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/90 to-cyan-500/80 text-white">
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

      <section className="border-y border-border/50 py-16 sm:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <ol className="mt-8 grid gap-6 md:grid-cols-2">
            {workflow.map((w) => (
              <li key={w.step}>
                <Card className="h-full border-border/70">
                  <CardContent className="p-6">
                    <div className="text-xs font-semibold uppercase text-violet-600">Step {w.step}</div>
                    <h3 className="mt-3 text-lg font-semibold">{w.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{w.body}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <FeatureSection eyebrow="Talent spotlight" title="Featured freelancers" description="Plus and Pro members receive priority placement.">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.length ? (
            featured.map((f) => (
              <Link key={f.id} href={`/users/${f.userId}`}>
                <Card className="h-full border-border/70 shadow-subtle">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500">
                        {f.imageUrl ? (
                          <Image src={f.imageUrl} alt="" fill className="object-cover" unoptimized />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                            {f.name.split(" ").map((p) => p[0]).join("")}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-semibold">{f.name}</span>
                          {f.verified ? <VerifiedBadge /> : null}
                        </div>
                        <div className="text-xs text-muted-foreground">{f.headline}</div>
                      </div>
                    </div>
                    <div className="mt-4 text-sm font-semibold text-violet-700 dark:text-violet-300">{f.hourlyRate}</div>
                    <p className="mt-2 text-xs text-muted-foreground">{f.metric}</p>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground sm:col-span-4">No public profiles yet.</p>
          )}
        </div>
        <div className="mt-8 flex justify-center">
          <Link href="/freelancers" className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:underline">
            View all freelancers
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </FeatureSection>

      <JobsHomeSections />

      <TestimonialSection title="Built for teams that ship." description="Clients and freelancers use Zion Workspace for accountable delivery." items={testimonials} />

      <FeatureSection eyebrow="Pricing" title="Clients post free. Freelancers upgrade for visibility." description="Unlimited client project posts on every plan.">
        <PricingCards tiers={getMarketingPricingTiers()} />
      </FeatureSection>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4">
          <FAQAccordion items={marketingFaqItems.slice(0, 4)} />
        </div>
      </section>

      <section className="pb-20">
        <FooterCta />
      </section>
    </>
  );
}
