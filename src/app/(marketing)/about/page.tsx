import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Mission, vision, and story behind Zion TeCHer—a freelance marketplace built for clarity, trust, and global collaboration."
};

export default function AboutPage() {
  return (
    <div className="border-b border-border/40 bg-gradient-to-b from-violet-500/[0.06] to-background">
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
          About Zion TeCHer
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Talent deserves contracts—not chaos.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          Zion TeCHer exists so hiring teams and freelancers can move fast without sacrificing trust.
          We combine structured proposals, transparent milestones, and messaging that stays tied to the
          work—not buried in threads.
        </p>

        <section className="mt-14 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Mission</h2>
          <p className="leading-relaxed text-muted-foreground">
            Empower anyone to hire or deliver premium freelance work with clarity—clear scope, fair
            process, and accountability on both sides of the engagement.
          </p>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Vision</h2>
          <p className="leading-relaxed text-muted-foreground">
            A global marketplace where outcomes beat optics: proposals are comparable, delivery is
            measurable, and reputation compounds through verified delivery—not vanity metrics.
          </p>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Company story</h2>
          <p className="leading-relaxed text-muted-foreground">
            Zion TeCHer began as an internal toolkit for distributed teams who were tired of vague
            scopes and surprise invoices. As workflows matured—contracts, milestones, secure
            collaboration—we opened the platform so clients and freelancers everywhere could benefit
            from the same discipline.
          </p>
          <p className="leading-relaxed text-muted-foreground">
            Today we invest in premium UX, thoughtful onboarding, and infrastructure that scales with
            your program—from solopreneurs to enterprise procurement teams.
          </p>
        </section>
      </div>
    </div>
  );
}
