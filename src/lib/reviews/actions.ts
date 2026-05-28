"use server";

import "server-only";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth/session";
import {
  createReview as createReviewSvc,
  getReviewEligibility,
  moderateReview as moderateReviewSvc
} from "@/lib/reviews/service";
import { createReviewSchema, moderateReviewSchema } from "@/lib/validators/review";

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

function revalidateReviewPaths(contractId: string, reviewedUserId?: string) {
  revalidatePath(`/dashboard/contracts/${contractId}`);
  revalidatePath("/admin/reviews");
  if (reviewedUserId) {
    revalidatePath(`/users/${reviewedUserId}`);
    revalidatePath("/freelancers");
  }
}

export async function createReviewAction(
  input: unknown
): Promise<ActionOk<{ reviewId: string }> | ActionErr> {
  const auth = await requireUser();
  if (!auth.ok) return auth;

  const parsed = createReviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid input", fieldErrors: flattenZod(parsed.error) };
  }

  const res = await createReviewSvc(auth.userId, auth.role, parsed.data);
  if (!res.ok) return { ok: false, error: res.error };

  const eligibility = await getReviewEligibility(auth.userId, auth.role, parsed.data.contractId);
  const reviewedUserId = eligibility.ok ? eligibility.data.reviewedUserId : undefined;
  revalidateReviewPaths(parsed.data.contractId, reviewedUserId);

  return { ok: true, reviewId: res.data.reviewId };
}

export async function moderateReviewAction(
  input: unknown
): Promise<ActionOk | ActionErr> {
  const auth = await requireUser();
  if (!auth.ok) return auth;
  if (auth.role !== Role.ADMIN) return { ok: false, error: "Forbidden" };

  const parsed = moderateReviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid input", fieldErrors: flattenZod(parsed.error) };
  }

  const res = await moderateReviewSvc(
    auth.userId,
    auth.role,
    parsed.data.reviewId,
    parsed.data.action
  );
  if (!res.ok) return { ok: false, error: res.error };

  revalidatePath("/admin/reviews");
  revalidatePath("/freelancers");

  return { ok: true };
}
