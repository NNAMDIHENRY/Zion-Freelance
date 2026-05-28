import type { Transaction, WithdrawalRequest } from "@prisma/client";

import type { SerializedTransaction, SerializedWithdrawal } from "@/lib/payments/types";

type TxRow = Transaction & {
  payment?: {
    contractId: string | null;
    contract?: { project: { title: string } | null } | null;
  } | null;
};

export function serializeTransaction(row: TxRow): SerializedTransaction {
  return {
    id: row.id,
    reference: row.reference,
    type: row.type,
    status: row.status,
    amount: Number(row.amount.toString()),
    currency: row.currency,
    description: row.description,
    source: row.source,
    balanceAfter: row.balanceAfter != null ? Number(row.balanceAfter.toString()) : null,
    createdAt: row.createdAt.toISOString(),
    contractId: row.payment?.contractId ?? null,
    contractTitle: row.payment?.contract?.project?.title ?? null
  };
}

export function serializeWithdrawal(row: WithdrawalRequest): SerializedWithdrawal {
  return {
    id: row.id,
    amount: Number(row.amount.toString()),
    currency: row.currency,
    status: row.status,
    payoutMethod: row.payoutMethod,
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? null
  };
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
