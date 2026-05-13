import Link from "next/link";
import { Role } from "@prisma/client";
import { DashboardSignOut } from "@/components/layout/dashboard-sign-out";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/auth/login");
  }

  const role = session.user.role;

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="h-9 w-9 rounded-xl bg-primary" aria-hidden />
            <span className="text-sm font-semibold tracking-tight">
              Dashboard
            </span>
          </Link>

          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <Link
              className="rounded-md px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              href="/dashboard"
            >
              Overview
            </Link>

            {role === Role.CLIENT ? (
              <Link
                className="rounded-md px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                href="/client"
              >
                Client
              </Link>
            ) : null}

            {role === Role.FREELANCER ? (
              <Link
                className="rounded-md px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                href="/freelancer"
              >
                Freelancer
              </Link>
            ) : null}

            {role === Role.ADMIN ? (
              <Link
                className="rounded-md px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                href="/admin"
              >
                Admin
              </Link>
            ) : null}
          </nav>

          <DashboardSignOut session={session} />
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </div>
    </div>
  );
}