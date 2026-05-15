import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "How Zion TeCHer collects, uses, and protects personal information across the freelance marketplace."
};

export default function PrivacyPage() {
  return (
    <div className="border-b border-border/40 bg-gradient-to-b from-violet-500/[0.04] to-background">
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
          Legal
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Privacy policy
        </h1>
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          Last updated{" "}
          {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}. Replace this
          draft with a policy reviewed by qualified privacy counsel before handling real user data.
        </p>

        <section className="mt-14 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Information we collect</h2>
          <p className="leading-relaxed text-muted-foreground">
            We collect information you provide (such as name, email, company, and messages), technical data from your
            device (like IP address and browser type), and usage data to operate and improve the Platform.
          </p>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">How we use information</h2>
          <p className="leading-relaxed text-muted-foreground">
            We use data to provide services, authenticate users, communicate about your account, detect abuse, comply
            with law, and analyze product performance. Marketing communications, if any, will include an opt-out where
            required.
          </p>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Sharing</h2>
          <p className="leading-relaxed text-muted-foreground">
            We may share information with service providers who assist our operations (hosting, email, analytics), when
            required by law, or to protect rights and safety. We do not sell personal information as a matter of policy;
            enterprise agreements may describe additional subprocessors.
          </p>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Retention and security</h2>
          <p className="leading-relaxed text-muted-foreground">
            We retain information as long as needed to fulfill the purposes above and meet legal obligations. We use
            industry-standard safeguards, though no method of transmission over the Internet is completely secure.
          </p>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Your choices</h2>
          <p className="leading-relaxed text-muted-foreground">
            Depending on your location, you may have rights to access, correct, delete, or export personal data, or to
            object to certain processing. Contact us to exercise applicable rights.
          </p>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">International transfers</h2>
          <p className="leading-relaxed text-muted-foreground">
            If you access the Platform from outside the country where we operate servers, your information may be
            transferred and processed across borders with appropriate safeguards as described in enterprise agreements
            where applicable.
          </p>
        </section>

        <section className="mt-12 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Contact</h2>
          <p className="leading-relaxed text-muted-foreground">
            Privacy questions or requests?{" "}
            <Link
              href="/contact"
              className="font-semibold text-violet-700 underline-offset-4 hover:underline dark:text-violet-300"
            >
              Reach the team
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
