"use server";

import "server-only";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import {
  acceptContract,
  approveContractCompletion,
  approveMilestone,
  fundEscrow,
  getContractDetailForUser,
  listContractsForUser,
  releaseMilestone,
  addContractMilestone,
  deleteContractMilestone,
  setupMilestones,
  submitContractCompletion,
  submitMilestoneWork,
  updateContractMilestone
} from "@/lib/contracts/service";
import { getSession } from "@/lib/auth/session";
import { milestoneInputSchema, setupMilestonesSchema } from "@/lib/validators/contract";

type ActionErr = { ok: false; error: string; fieldErrors?: Record<string, string[]> };
type ActionOk<T extends object = object> = { ok: true } & T;

function flattenZod(err: import("zod").ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const i of err.errors) {
    const k = i.path.join(".") || "_";
    out[k] = out[k] ?? [];
    out[k].push(i.message);
  }
  return out;
}

async function requireUser() {
  const session = await getSession();
  if (!session?.user) {
    return { ok: false as const, error: "Unauthorized" };
  }
  return {
    ok: true as const,
    userId: session.user.id,
    role: session.user.role as Role
  };
}

function revalidateContract(contractId: string, projectId?: string) {
  revalidatePath("/dashboard/contracts");
  revalidatePath(`/dashboard/contracts/${contractId}`);
  if (projectId) {
    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath(`/dashboard/proposals`);
  }
}

export async function acceptContractAction(
  contractId: string
): Promise<ActionOk | ActionErr> {
  const auth = await requireUser();
  if (!auth.ok) return { ok: false, error: auth.error };

  const res = await acceptContract(auth.userId, auth.role, contractId);
  if (!res.ok) return { ok: false, error: res.error };

  const detail = await getContractDetailForUser(auth.userId, auth.role, contractId);
  revalidateContract(contractId, detail.ok ? detail.data.row.project.id : undefined);
  return { ok: true };
}

export async function fundEscrowAction(
  contractId: string,
  options?: { method?: "wallet" | "flutterwave"; amount?: number }
): Promise<ActionOk<{ checkoutUrl?: string }> | ActionErr> {
  const auth = await requireUser();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (options?.method === "flutterwave") {
    const { createEscrowFundingSession } = await import("@/lib/payments/service");
    const res = await createEscrowFundingSession(auth.userId, contractId, options.amount);
    if (!res.ok) return { ok: false, error: res.error };
    return { ok: true, checkoutUrl: res.data.checkoutUrl };
  }

  const res = await fundEscrow(auth.userId, auth.role, contractId, options?.amount);
  if (!res.ok) return { ok: false, error: res.error };

  const detail = await getContractDetailForUser(auth.userId, auth.role, contractId);
  revalidateContract(contractId, detail.ok ? detail.data.row.project.id : undefined);
  return { ok: true };
}

export async function setupMilestonesAction(
  contractId: string,
  input: unknown
): Promise<ActionOk | ActionErr> {
  const auth = await requireUser();
  if (!auth.ok) return { ok: false, error: auth.error };

  const parsed = setupMilestonesSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Validation failed", fieldErrors: flattenZod(parsed.error) };
  }

  const res = await setupMilestones(auth.userId, auth.role, contractId, parsed.data);
  if (!res.ok) return { ok: false, error: res.error };

  revalidateContract(contractId);
  return { ok: true };
}

export async function addMilestoneAction(
  contractId: string,
  input: unknown
): Promise<ActionOk | ActionErr> {
  const auth = await requireUser();
  if (!auth.ok) return { ok: false, error: auth.error };

  const parsed = milestoneInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Validation failed", fieldErrors: flattenZod(parsed.error) };
  }

  const res = await addContractMilestone(auth.userId, auth.role, contractId, parsed.data);
  if (!res.ok) return { ok: false, error: res.error };

  revalidateContract(contractId);
  return { ok: true };
}

export async function updateMilestoneAction(
  contractId: string,
  milestoneId: string,
  input: unknown
): Promise<ActionOk | ActionErr> {
  const auth = await requireUser();
  if (!auth.ok) return { ok: false, error: auth.error };

  const parsed = milestoneInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Validation failed", fieldErrors: flattenZod(parsed.error) };
  }

  const res = await updateContractMilestone(
    auth.userId,
    auth.role,
    contractId,
    milestoneId,
    parsed.data
  );
  if (!res.ok) return { ok: false, error: res.error };

  revalidateContract(contractId);
  return { ok: true };
}

export async function deleteMilestoneAction(
  contractId: string,
  milestoneId: string
): Promise<ActionOk | ActionErr> {
  const auth = await requireUser();
  if (!auth.ok) return { ok: false, error: auth.error };

  const res = await deleteContractMilestone(auth.userId, auth.role, contractId, milestoneId);
  if (!res.ok) return { ok: false, error: res.error };

  revalidateContract(contractId);
  return { ok: true };
}

export async function submitMilestoneAction(
  contractId: string,
  milestoneId: string
): Promise<ActionOk | ActionErr> {
  const auth = await requireUser();
  if (!auth.ok) return { ok: false, error: auth.error };

  const res = await submitMilestoneWork(auth.userId, auth.role, contractId, milestoneId);
  if (!res.ok) return { ok: false, error: res.error };

  revalidateContract(contractId);
  return { ok: true };
}

export async function approveMilestoneAction(
  contractId: string,
  milestoneId: string
): Promise<ActionOk | ActionErr> {
  const auth = await requireUser();
  if (!auth.ok) return { ok: false, error: auth.error };

  const res = await approveMilestone(auth.userId, auth.role, contractId, milestoneId);
  if (!res.ok) return { ok: false, error: res.error };

  revalidateContract(contractId);
  return { ok: true };
}

export async function releaseMilestoneAction(
  contractId: string,
  milestoneId: string
): Promise<ActionOk | ActionErr> {
  const auth = await requireUser();
  if (!auth.ok) return { ok: false, error: auth.error };

  const res = await releaseMilestone(auth.userId, auth.role, contractId, milestoneId);
  if (!res.ok) return { ok: false, error: res.error };

  revalidateContract(contractId);
  return { ok: true };
}

export async function submitCompletionAction(
  contractId: string,
  note?: string
): Promise<ActionOk | ActionErr> {
  const auth = await requireUser();
  if (!auth.ok) return { ok: false, error: auth.error };

  const res = await submitContractCompletion(auth.userId, auth.role, contractId, note);
  if (!res.ok) return { ok: false, error: res.error };

  revalidateContract(contractId);
  return { ok: true };
}

export async function approveCompletionAction(contractId: string): Promise<ActionOk | ActionErr> {
  const auth = await requireUser();
  if (!auth.ok) return { ok: false, error: auth.error };

  const res = await approveContractCompletion(auth.userId, auth.role, contractId);
  if (!res.ok) return { ok: false, error: res.error };

  const detail = await getContractDetailForUser(auth.userId, auth.role, contractId);
  revalidateContract(contractId, detail.ok ? detail.data.row.project.id : undefined);
  return { ok: true };
}

export async function listContractsAction() {
  const auth = await requireUser();
  if (!auth.ok) return { ok: false as const, error: auth.error };
  return listContractsForUser(auth.userId, auth.role);
}
