import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null; // or redirect("/auth/login") if you want strict guard
  }

  const user = session.user;
  const role = user.role;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Hello, {user.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You are signed in as{" "}
          <span className="font-medium text-foreground">
            {String(role ?? "").replaceAll("_", " ")}
          </span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5">
          Session active ✔
        </div>

        <div className="rounded-2xl border bg-card p-5">
          Protected dashboard ✔
        </div>

        <div className="rounded-2xl border bg-card p-5">
          Role: {role}
        </div>
      </div>
    </div>
  );
}