"use server";

import "server-only";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth/session";
import {
  acceptProposal as acceptProposalSvc,
  getProposalDetailForUser,
  listFreelancerProposals as listFreelancerProposalsSvc,
  listProjectProposals as listProjectProposalsSvc,
  rejectProposal as rejectProposalSvc,
  reviewProposal as reviewProposalSvc,
  submitProposal as submitProposalSvc,
  updateProposal as updateProposalSvc,
  withdrawProposal as withdrawProposalSvc
} from "@/lib/proposals/service";
import { proposalWriteSchema } from "@/lib/validators/proposal";

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

export async function submitProposalAction(
  projectId: string,
  input: unknown
): Promise<ActionOk<{ id: string }> | ActionErr> {
  const auth = await requireUser();
  if (!auth.ok) return { ok: false, error: auth.error };

  const parsed = proposalWriteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Validation failed", fieldErrors: flattenZod(parsed.error) };
  }

  const res = await submitProposalSvc(auth.userId, auth.role, projectId, parsed.data);
  if (!res.ok) return { ok: false, error: res.error };

  revalidatePath("/dashboard/proposals");
  revalidatePath(`/dashboard/projects/${projectId}/proposal`);
  revalidatePath(`/dashboard/projects/${projectId}/proposals`);
  revalidatePath(`/dashboard/proposals/${res.data.id}`);
  return { ok: true, id: res.data.id };
}

export async function updateProposalAction(
  proposalId: string,
  input: unknown
): Promise<ActionOk<{ id: string }> | ActionErr> {
  const auth = await requireUser();
  if (!auth.ok) return { ok: false, error: auth.error };

  const parsed = proposalWriteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Validation failed", fieldErrors: flattenZod(parsed.error) };
  }

  const res = await updateProposalSvc(auth.userId, auth.role, proposalId, parsed.data);
  if (!res.ok) return { ok: false, error: res.error };

  revalidatePath("/dashboard/proposals");
  revalidatePath(`/dashboard/proposals/${proposalId}`);
  const detail = await getProposalDetailForUser(auth.userId, auth.role, proposalId);
  if (detail.ok) {
    revalidatePath(`/dashboard/projects/${detail.data.projectId}/proposals`);
    revalidatePath(`/dashboard/projects/${detail.data.projectId}/proposal`);
  }
  return { ok: true, id: res.data.id };
}

export async function withdrawProposalAction(proposalId: string): Promise<ActionOk | ActionErr> {
  const auth = await requireUser();
  if (!auth.ok) return { ok: false, error: auth.error };

  const res = await withdrawProposalSvc(auth.userId, auth.role, proposalId);
  if (!res.ok) return { ok: false, error: res.error };

  revalidatePath("/dashboard/proposals");
  revalidatePath(`/dashboard/proposals/${proposalId}`);
  const detail = await getProposalDetailForUser(auth.userId, auth.role, proposalId);
  if (detail.ok) {
    revalidatePath(`/dashboard/projects/${detail.data.projectId}/proposals`);
    revalidatePath(`/dashboard/projects/${detail.data.projectId}/proposal`);
  }
  return { ok: true };
}

export async function reviewProposalAction(proposalId: string): Promise<ActionOk | ActionErr> {
  const auth = await requireUser();
  if (!auth.ok) return { ok: false, error: auth.error };

  const res = await reviewProposalSvc(auth.userId, auth.role, proposalId);
  if (!res.ok) return { ok: false, error: res.error };

  revalidatePath("/dashboard/proposals");
  revalidatePath(`/dashboard/proposals/${proposalId}`);
  const detail = await getProposalDetailForUser(auth.userId, auth.role, proposalId);
  if (detail.ok) {
    revalidatePath(`/dashboard/projects/${detail.data.projectId}/proposals`);
  }
  return { ok: true };
}

export async function acceptProposalAction(
  proposalId: string
): Promise<ActionOk<{ contractId: string }> | ActionErr> {
  const auth = await requireUser();
  if (!auth.ok) return { ok: false, error: auth.error };

  const res = await acceptProposalSvc(auth.userId, auth.role, proposalId);
  if (!res.ok) return { ok: false, error: res.error };

  const { projectId } = res.data;
  revalidatePath("/dashboard/proposals");
  revalidatePath(`/dashboard/proposals/${proposalId}`);
  revalidatePath(`/dashboard/projects/${projectId}/proposals`);
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath(`/dashboard/projects/${projectId}/proposal`);
  return { ok: true, contractId: res.data.contractId };
}

export async function rejectProposalAction(proposalId: string): Promise<ActionOk | ActionErr> {
  const auth = await requireUser();
  if (!auth.ok) return { ok: false, error: auth.error };

  const res = await rejectProposalSvc(auth.userId, auth.role, proposalId);
  if (!res.ok) return { ok: false, error: res.error };

  revalidatePath("/dashboard/proposals");
  revalidatePath(`/dashboard/proposals/${proposalId}`);
  const detail = await getProposalDetailForUser(auth.userId, auth.role, proposalId);
  if (detail.ok) {
    revalidatePath(`/dashboard/projects/${detail.data.projectId}/proposals`);
  }
  return { ok: true };
}

export async function listFreelancerProposalsAction() {
  const auth = await requireUser();
  if (!auth.ok) return { ok: false as const, error: auth.error };
  return listFreelancerProposalsSvc(auth.userId, auth.role);
}

export async function listProjectProposalsAction(projectId: string) {
  const auth = await requireUser();
  if (!auth.ok) return { ok: false as const, error: auth.error };
  return listProjectProposalsSvc(auth.userId, auth.role, projectId);
}
