import { Role } from "@prisma/client";
import { Suspense } from "react";

import { WalletDashboard } from "@/components/payments/WalletDashboard";
import { requireRole } from "@/lib/auth/guard";
import { getSession } from "@/lib/auth/session";
import {
  getTransactionHistory,
  getWalletForUser,
  getWithdrawalsForUser
} from "@/lib/payments/service";
import { serializeTransaction, serializeWithdrawal } from "@/lib/payments/serialize";

export default async function FreelancerEarningsPage() {
  await requireRole([Role.FREELANCER]);

  const session = await getSession();
  const userId = session!.user!.id;

  const { wallet, snapshot } = await getWalletForUser(userId);
  const [history, withdrawals] = await Promise.all([
    getTransactionHistory(userId, { page: 1, pageSize: 15 }),
    getWithdrawalsForUser(userId, 10)
  ]);

  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <WalletDashboard
        role={Role.FREELANCER}
        title="Earnings"
        description="Milestone releases, wallet balance, and withdrawal requests."
        currency={wallet.currency}
        snapshot={snapshot}
        transactions={history.rows.map(serializeTransaction)}
        withdrawals={withdrawals.map(serializeWithdrawal)}
        transactionTotal={history.total}
      />
    </Suspense>
  );
}
