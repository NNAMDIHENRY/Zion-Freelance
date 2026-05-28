"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";

import { Button } from "@/components/ui/button";

const Row = "div" as const;

export function AuthAwareHeroCtas() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Row className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button size="lg" className="rounded-xl px-6 shadow-subtle" disabled>
          Loading…
        </Button>
      </Row>
    );
  }

  if (session?.user) {
    const role = session.user.role;
    const primaryHref =
      role === Role.FREELANCER
        ? "/freelancer/jobs"
        : role === Role.ADMIN
          ? "/admin"
          : "/dashboard/projects";
    const primaryLabel =
      role === Role.FREELANCER
        ? "Browse open jobs"
        : role === Role.ADMIN
          ? "Admin console"
          : "My projects";

    return (
      <Row className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button asChild size="lg" className="rounded-xl px-6 shadow-subtle">
          <Link href={primaryHref}>{primaryLabel}</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="rounded-xl px-6">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </Row>
    );
  }

  return (
    <Row className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
      <Button asChild size="lg" className="rounded-xl px-6 shadow-subtle">
        <Link href="/auth/register">Start hiring</Link>
      </Button>
      <Button asChild size="lg" variant="outline" className="rounded-xl px-6">
        <Link href="/how-it-works">See how it works</Link>
      </Button>
    </Row>
  );
}
