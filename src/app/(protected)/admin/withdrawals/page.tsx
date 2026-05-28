import { Role, WithdrawalStatus } from "@prisma/client";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { WithdrawalApprovalTable } from "@/components/admin/WithdrawalApprovalTable";
import { requireRole } from "@/lib/auth/guard";
import { listAdminWithdrawals } from "@/lib/admin/payments/service";

export default async function AdminWithdrawalsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await requireRole([Role.ADMIN]);
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const status =
    sp.status && Object.values(WithdrawalStatus).includes(sp.status as WithdrawalStatus)
      ? (sp.status as WithdrawalStatus)
      : undefined;
  const result = await listAdminWithdrawals(page, 20, status);

  return (
    <main className="space-y-8">
      <AdminPageHeader
        title="Withdrawal approvals"
        description="Review payout requests, flag fraud indicators, and prevent duplicate approvals."
        crumbs={[{ label: "Withdrawals" }]}
      />

      <nav className="flex flex-wrap gap-2">
        <Link
          href="/admin/withdrawals"
          className={!status ? "rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground" : "rounded-full border px-3 py-1 text-xs text-muted-foreground"}
        >
          All pending
        </Link>
        {Object.values(WithdrawalStatus).map((s) => (
          <Link
            key={s}
            href={`/admin/withdrawals?status=${s}`}
            className={
              status === s
                ? "rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground"
                : "rounded-full border px-3 py-1 text-xs text-muted-foreground"
            }
          >
            {s}
          </Link>
        ))}
      </nav>

      <WithdrawalApprovalTable items={result.items} />
    </main>
  );
}
