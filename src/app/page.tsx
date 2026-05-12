export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-zinc-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 sm:py-14">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-zinc-950" aria-hidden />
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">
                Zion TeCHer
              </div>
              <div className="text-xs text-zinc-600">Freelance Marketplace</div>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <a
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              href="#features"
            >
              Features
            </a>
            <a
              className="rounded-lg bg-zinc-950 px-3 py-2 text-sm font-semibold text-white shadow-subtle hover:bg-zinc-900"
              href="/api/auth/signin"
            >
              Sign in
            </a>
          </nav>
        </header>

        <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="flex flex-col gap-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 shadow-subtle">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Production-grade marketplace platform
            </div>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
              Hire globally. Work securely. Scale confidently.
            </h1>
            <p className="max-w-xl text-pretty text-base leading-relaxed text-zinc-600">
              A premium, trustworthy freelance marketplace with escrow,
              messaging, wallets, reviews, and admin tooling—built for global
              scale.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                className="inline-flex items-center justify-center rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white shadow-subtle hover:bg-zinc-900"
                href="/api/auth/signin"
              >
                Get started
              </a>
              <a
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
                href="#features"
              >
                Explore features
              </a>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Escrow & milestones",
                desc: "Hold funds securely, release on delivery."
              },
              {
                title: "Proposals & contracts",
                desc: "Structured bidding with clear terms."
              },
              {
                title: "Messaging & files",
                desc: "Project chat with secure uploads."
              },
              {
                title: "Wallet & payouts",
                desc: "Flutterwave payments and withdrawals."
              }
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-subtle"
              >
                <div className="text-sm font-semibold">{card.title}</div>
                <div className="mt-2 text-sm leading-relaxed text-zinc-600">
                  {card.desc}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="grid gap-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-subtle">
            <div className="text-sm font-semibold">Next module</div>
            <div className="mt-2 text-sm text-zinc-600">
              Authentication + roles (Client/Freelancer/Admin) will be wired
              next, then dashboards and project posting.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

