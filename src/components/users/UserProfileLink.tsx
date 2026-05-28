import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function UserProfileLink({
  userId,
  role,
  children,
  className
}: {
  userId: string;
  role?: "CLIENT" | "FREELANCER" | "ADMIN" | string;
  children: ReactNode;
  className?: string;
}) {
  const href =
    role === "CLIENT" ? `/clients/${userId}` : `/users/${userId}`;

  return (
    <Link href={href} className={cn("font-medium text-primary hover:underline", className)}>
      {children}
    </Link>
  );
}
