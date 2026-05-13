import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";

export async function requireSession() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/auth/login");
  }
  return session;
}

export async function requireRole(allowed: Role[]) {
  const session = await requireSession();
  if (!allowed.includes(session.user.role)) {
    redirect("/dashboard");
  }
  return session;
}
