import type { Role } from "@prisma/client";
import type { Session } from "next-auth";

export function getUserRole(session: Session | null): Role | null {
  return session?.user?.role ?? null;
}
