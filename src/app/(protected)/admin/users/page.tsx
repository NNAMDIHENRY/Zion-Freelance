import { Role } from "@prisma/client";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { requireRole } from "@/lib/auth/guard";
import { listAdminUsers } from "@/lib/admin/users/service";
import { adminUserListSchema } from "@/lib/validators/admin";

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRole([Role.ADMIN]);
  const sp = await searchParams;
  const parsed = adminUserListSchema.safeParse({
    q: sp.q,
    role: sp.role,
    accountStatus: sp.accountStatus,
    flagged: sp.flagged,
    page: sp.page,
    pageSize: sp.pageSize
  });
  const input = parsed.success ? parsed.data : adminUserListSchema.parse({});
  const result = await listAdminUsers(input);

  return (
    <main className="space-y-8">
      <AdminPageHeader
        title="User management"
        description="Search accounts, review status, and apply moderation actions."
        crumbs={[{ label: "Users" }]}
      />

      <form className="flex flex-wrap gap-2" method="get">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Search name or email"
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Search
        </button>
      </form>

      <UserManagementTable items={result.items} />

      {result.totalPages > 1 ? (
        <p className="text-center text-sm text-muted-foreground">
          Page {result.page} of {result.totalPages} ·{" "}
          <Link href={`/admin/users?page=${result.page + 1}&q=${sp.q ?? ""}`}>Next</Link>
        </p>
      ) : null}
    </main>
  );
}
