import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "Terms of service for using Zion TeCHer—acceptable use, accounts, marketplace conduct, and limitations."
};

export default function TermsPage() {
  return (
    <div className="border-b border-border/40 bg-gradient-to-b from-background to-muted/10">
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
          Legal
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Terms of service
        </h1>
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          Last updated{" "}
          {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}. This is a
          starter template for your counsel to replace before production launch.
        </p>

        <section className="mt-14 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Agreement</h2>
          <p className="leading-relaxed text-muted-foreground">
            By accessing or using Zion TeCHer (&ldquo;Platform&rdquo;), you agree to these Terms. If you do not agree,
            do not use the Platform.
          </p>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Accounts</h2>
          <p className="leading-relaxed text-muted-foreground">
            You are responsible for safeguarding your credentials and for activity under your account. Provide accurate
            information and keep it current.
          </p>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Marketplace conduct</h2>
          <p className="leading-relaxed text-muted-foreground">
            Users must interact professionally, honor agreed scope and timelines, and comply with applicable laws.
            Harassment, fraud, spam, or attempts to circumvent Platform workflows are prohibited.
          </p>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Fees and billing</h2>
          <p className="leading-relaxed text-muted-foreground">
            Subscription or marketplace fees, if any, will be described at checkout or in your order form. Taxes may
            apply based on jurisdiction.
          </p>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Disclaimers</h2>
          <p className="leading-relaxed text-muted-foreground">
            The Platform is provided on an &ldquo;as is&rdquo; basis. To the fullest extent permitted by law, Zion
            TeCHer disclaims warranties not expressly stated here. Nothing in these Terms limits liability that cannot be
            limited by law.
          </p>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Changes</h2>
          <p className="leading-relaxed text-muted-foreground">
            We may update these Terms. Material changes will be communicated through the Platform or by email where
            appropriate. Continued use after changes constitutes acceptance.
          </p>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Contact</h2>
          <p className="leading-relaxed text-muted-foreground">
            Questions about these Terms?{" "}
            <Link
              href="/contact"
              className="font-semibold text-violet-700 underline-offset-4 hover:underline dark:text-violet-300"
            >
              Contact us
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
