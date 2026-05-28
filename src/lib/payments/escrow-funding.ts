import "server-only";

import {
  ContractStatus,
  EscrowRecordType,
  MilestoneStatus,
  Prisma,
  type Prisma as PrismaNamespace
} from "@prisma/client";

import { assertMilestoneTransition, deriveEscrowStatus } from "@/lib/contracts/transitions";

type Tx = PrismaNamespace.TransactionClient;

/**
 * Core escrow funding logic shared by wallet debits and Flutterwave settlements.
 */
export async function applyEscrowFundingInTransaction(
  tx: Tx,
  params: {
    contractId: string;
    fundAmount: number;
    currency: string;
    note: string;
  }
) {
  const contract = await tx.contract.findUnique({
    where: { id: params.contractId },
    include: { escrow: true, milestones: { orderBy: { sortOrder: "asc" } } }
  });
  if (!contract?.escrow) throw new Error("Escrow not found");

  const funded = Number(contract.escrow.fundedAmount.toString());
  const newFunded = funded + params.fundAmount;
  const nextStatus = deriveEscrowStatus(
    contract.agreedAmount,
    newFunded,
    contract.escrow.releasedAmount
  );

  await tx.escrow.update({
    where: { id: contract.escrow.id },
    data: {
      fundedAmount: newFunded,
      status: nextStatus,
      fundedAt: contract.escrow.fundedAt ?? new Date()
    }
  });

  const record = await tx.escrowRecord.create({
    data: {
      escrowId: contract.escrow.id,
      type: EscrowRecordType.FUND,
      amount: params.fundAmount,
      currency: params.currency,
      note: params.note
    }
  });

  let toAllocate = params.fundAmount;
  for (const m of contract.milestones) {
    if (toAllocate <= 0) break;
    if (m.status !== MilestoneStatus.PENDING) continue;
    const mAmt = Number(m.amount.toString());
    if (mAmt <= toAllocate + 0.0001) {
      assertMilestoneTransition(MilestoneStatus.PENDING, MilestoneStatus.FUNDED);
      await tx.contractMilestone.update({
        where: { id: m.id },
        data: {
          status:
            contract.status === ContractStatus.ACTIVE
              ? MilestoneStatus.ACTIVE
              : MilestoneStatus.FUNDED
        }
      });
      toAllocate -= mAmt;
    }
  }

  return { escrowRecordId: record.id, contract };
}

export function computeEscrowFundAmount(
  agreed: Prisma.Decimal,
  funded: Prisma.Decimal,
  requested?: number
): { fundAmount: number; remaining: number } {
  const agreedN = Number(agreed.toString());
  const fundedN = Number(funded.toString());
  const remaining = agreedN - fundedN;
  if (remaining <= 0.0001) {
    return { fundAmount: 0, remaining: 0 };
  }
  const fundAmount = requested != null ? Math.min(requested, remaining) : remaining;
  return { fundAmount, remaining };
}
