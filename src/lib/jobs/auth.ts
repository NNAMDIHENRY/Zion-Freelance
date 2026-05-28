import "server-only";

import { AccountStatus } from "@prisma/client";

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export type JobAuthErr = { ok: false; error: string };

/** Verified = email verified + active account (required to post jobs). */
export async function requireVerifiedPoster(): Promise<
  { ok: true; userId: string } | JobAuthErr
> {
  const session = await getSession();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailVerified: true, accountStatus: true, verifiedAt: true, name: true }
  });
  if (!user?.emailVerified) return { ok: false, error: "Verify your email to post jobs" };
  if (user.accountStatus !== AccountStatus.ACTIVE) {
    return { ok: false, error: "Account is not active" };
  }

  return { ok: true, userId: session.user.id };
}

export async function requireSessionUser(): Promise<
  { ok: true; userId: string } | JobAuthErr
> {
  const session = await getSession();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };
  return { ok: true, userId: session.user.id };
}
