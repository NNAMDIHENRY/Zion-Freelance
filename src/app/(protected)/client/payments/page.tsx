import { Role } from "@prisma/client";
import { Suspense } from "react";

import { WalletDashboard } from "@/components/payments/WalletDashboard";
import { requireRole } from "@/lib/auth/guard";
import { getSession } from "@/lib/auth/session";
import { getTransactionHistory, getWalletForUser } from "@/lib/payments/service";
import { serializeTransaction } from "@/lib/payments/serialize";

export default async function ClientPaymentsPage() {
  await requireRole([Role.CLIENT]);

  const session = await getSession();
  const userId = session!.user!.id;

  const { wallet, snapshot } = await getWalletForUser(userId);
  const history = await getTransactionHistory(userId, { page: 1, pageSize: 15 });

  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <WalletDashboard
        role={Role.CLIENT}
        title="Payments"
        description="Fund your wallet, pay into contract escrow, and review deposit history."
        currency={wallet.currency}
        snapshot={snapshot}
        transactions={history.rows.map(serializeTransaction)}
        withdrawals={[]}
        transactionTotal={history.total}
      />
    </Suspense>
  );
}
