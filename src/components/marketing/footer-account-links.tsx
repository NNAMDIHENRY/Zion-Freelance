"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export function FooterAccountLinks() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <li>
        <span className="text-muted-foreground">Loading…</span>
      </li>
    );
  }

  if (session?.user) {
    return (
      <>
        <li>
          <Link className="hover:text-foreground" href="/dashboard">
            Dashboard
          </Link>
        </li>
        <li>
          <Link className="hover:text-foreground" href="/dashboard/profile">
            Profile
          </Link>
        </li>
        <li>
          <Link className="hover:text-foreground" href="/dashboard/settings">
            Settings
          </Link>
        </li>
      </>
    );
  }

  return (
    <>
      <li>
        <Link className="hover:text-foreground" href="/auth/login">
          Sign in
        </Link>
      </li>
      <li>
        <Link className="hover:text-foreground" href="/auth/register">
          Create account
        </Link>
      </li>
    </>
  );
}
