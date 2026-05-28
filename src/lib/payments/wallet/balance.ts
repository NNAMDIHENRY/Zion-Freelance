import "server-only";

import type { Prisma } from "@prisma/client";
import { WithdrawalStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import type { WalletBalanceSnapshot } from "@/lib/payments/types";

type WalletRow = {
  balance: Prisma.Decimal;
  lockedBalance: Prisma.Decimal;
  pendingBalance: Prisma.Decimal;
  currency: string;
};

function toNum(d: Prisma.Decimal): number {
  return Number(d.toString());
}

export function snapshotFromWallet(wallet: WalletRow, withdrawnTotal: number): WalletBalanceSnapshot {
  return {
    currency: wallet.currency,
    available: toNum(wallet.balance),
    locked: toNum(wallet.lockedBalance),
    pending: toNum(wallet.pendingBalance),
    withdrawn: withdrawnTotal
  };
}

export async function getWithdrawnTotal(walletId: string): Promise<number> {
  const agg = await prisma.withdrawalRequest.aggregate({
    where: { walletId, status: WithdrawalStatus.COMPLETED },
    _sum: { amount: true }
  });
  return agg._sum.amount ? Number(agg._sum.amount.toString()) : 0;
}

export async function getWalletBalanceSnapshot(walletId: string): Promise<WalletBalanceSnapshot | null> {
  const wallet = await prisma.wallet.findUnique({
    where: { id: walletId },
    select: { balance: true, lockedBalance: true, pendingBalance: true, currency: true }
  });
  if (!wallet) return null;
  const withdrawn = await getWithdrawnTotal(walletId);
  return snapshotFromWallet(wallet, withdrawn);
}
