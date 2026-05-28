import {
  ContractStatus,
  EscrowStatus,
  MilestoneStatus
} from "@prisma/client";

const CONTRACT_TRANSITIONS: Record<ContractStatus, readonly ContractStatus[]> = {
  [ContractStatus.PENDING]: [ContractStatus.ACTIVE, ContractStatus.TERMINATED],
  [ContractStatus.ACTIVE]: [ContractStatus.COMPLETED, ContractStatus.DISPUTED, ContractStatus.TERMINATED],
  [ContractStatus.COMPLETED]: [],
  [ContractStatus.TERMINATED]: [],
  [ContractStatus.DISPUTED]: [ContractStatus.ACTIVE, ContractStatus.TERMINATED]
};

const MILESTONE_TRANSITIONS: Record<MilestoneStatus, readonly MilestoneStatus[]> = {
  [MilestoneStatus.PENDING]: [MilestoneStatus.FUNDED],
  [MilestoneStatus.FUNDED]: [MilestoneStatus.ACTIVE],
  [MilestoneStatus.ACTIVE]: [MilestoneStatus.SUBMITTED],
  [MilestoneStatus.SUBMITTED]: [MilestoneStatus.APPROVED],
  [MilestoneStatus.APPROVED]: [MilestoneStatus.RELEASED],
  [MilestoneStatus.RELEASED]: []
};

export function canTransitionContract(from: ContractStatus, to: ContractStatus) {
  return CONTRACT_TRANSITIONS[from].includes(to);
}

export function canTransitionMilestone(from: MilestoneStatus, to: MilestoneStatus) {
  return MILESTONE_TRANSITIONS[from].includes(to);
}

export function assertContractTransition(from: ContractStatus, to: ContractStatus) {
  if (!canTransitionContract(from, to)) {
    throw new Error(`Invalid contract transition: ${from} → ${to}`);
  }
}

export function assertMilestoneTransition(from: MilestoneStatus, to: MilestoneStatus) {
  if (!canTransitionMilestone(from, to)) {
    throw new Error(`Invalid milestone transition: ${from} → ${to}`);
  }
}

type AmountLike = { toString(): string } | number;

function amountValue(v: AmountLike) {
  return typeof v === "number" ? v : Number(v.toString());
}

/** Derive escrow display state from funded/released vs contract total. */
export function deriveEscrowStatus(
  total: AmountLike,
  funded: AmountLike,
  released: AmountLike
): EscrowStatus {
  const t = amountValue(total);
  const f = amountValue(funded);
  const r = amountValue(released);
  if (t <= 0) return EscrowStatus.AWAITING_FUNDING;
  if (r >= t - 0.0001) return EscrowStatus.RELEASED;
  if (r > 0) return EscrowStatus.PARTIALLY_RELEASED;
  if (f >= t - 0.0001) return EscrowStatus.FUNDED;
  if (f > 0) return EscrowStatus.PARTIALLY_FUNDED;
  return EscrowStatus.AWAITING_FUNDING;
}

export function pendingEscrowAmount(
  total: { toString(): string },
  funded: { toString(): string },
  released: { toString(): string }
) {
  const t = Number(total.toString());
  const f = Number(funded.toString());
  const r = Number(released.toString());
  return Math.max(0, t - f);
}

export function heldEscrowAmount(
  funded: { toString(): string },
  released: { toString(): string }
) {
  return Math.max(0, Number(funded.toString()) - Number(released.toString()));
}
