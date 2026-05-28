"use server";

import "server-only";

import { DisputeStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { AdminPermission, requireAdmin } from "@/lib/admin/permissions";
import { updateDisputeStatus } from "@/lib/admin/disputes/service";
import { adminWithdrawalAction } from "@/lib/admin/payments/service";
import { setProjectModeration } from "@/lib/admin/projects/service";
import { resolveAbuseReport } from "@/lib/admin/reports/service";
import { moderateUserAccount } from "@/lib/admin/users/service";
import {
  adminDisputeResolveSchema,
  adminProjectModerationSchema,
  adminReportResolveSchema,
  adminUserActionSchema,
  adminWithdrawalActionSchema
} from "@/lib/validators/admin";

type Err = { ok: false; error: string };
type Ok = { ok: true };

function fail(msg: string): Err {
  return { ok: false, error: msg };
}

const ADMIN_PATHS = [
  "/admin",
  "/admin/users",
  "/admin/projects",
  "/admin/disputes",
  "/admin/payments",
  "/admin/withdrawals",
  "/admin/reports",
  "/admin/analytics",
  "/admin/moderation",
  "/admin/reviews"
];

function revalidateAdmin() {
  for (const p of ADMIN_PATHS) revalidatePath(p);
}

export async function adminUserActionAction(
  raw: unknown
): Promise<Err | Ok> {
  const session = await requireAdmin(AdminPermission.USERS_MANAGE);
  const parsed = adminUserActionSchema.safeParse(raw);
  if (!parsed.success) return fail("Invalid input");

  try {
    await moderateUserAccount(
      session.user.id,
      parsed.data.userId,
      parsed.data.action,
      parsed.data.reason
    );
    revalidateAdmin();
    return { ok: true };
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Action failed");
  }
}

export async function adminProjectModerationAction(
  raw: unknown
): Promise<Err | Ok> {
  const session = await requireAdmin(AdminPermission.PROJECTS_MODERATE);
  const parsed = adminProjectModerationSchema.safeParse(raw);
  if (!parsed.success) return fail("Invalid input");

  try {
    await setProjectModeration(
      session.user.id,
      parsed.data.projectId,
      parsed.data.status,
      parsed.data.note
    );
    revalidateAdmin();
    return { ok: true };
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Action failed");
  }
}

export async function adminDisputeAction(raw: unknown): Promise<Err | Ok> {
  const session = await requireAdmin(AdminPermission.DISPUTES_RESOLVE);
  const parsed = adminDisputeResolveSchema.safeParse(raw);
  if (!parsed.success) return fail("Invalid input");

  try {
    await updateDisputeStatus(
      session.user.id,
      parsed.data.disputeId,
      parsed.data.status as DisputeStatus,
      parsed.data.resolution
    );
    revalidateAdmin();
    return { ok: true };
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Action failed");
  }
}

export async function adminReportAction(raw: unknown): Promise<Err | Ok> {
  const session = await requireAdmin(AdminPermission.REPORTS_MODERATE);
  const parsed = adminReportResolveSchema.safeParse(raw);
  if (!parsed.success) return fail("Invalid input");

  try {
    await resolveAbuseReport(
      session.user.id,
      parsed.data.reportId,
      parsed.data.status,
      parsed.data.resolutionNote,
      parsed.data.severity
    );
    revalidateAdmin();
    return { ok: true };
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Action failed");
  }
}

export async function adminWithdrawalActionAction(
  raw: unknown
): Promise<Err | Ok> {
  const session = await requireAdmin(AdminPermission.WITHDRAWALS_APPROVE);
  const parsed = adminWithdrawalActionSchema.safeParse(raw);
  if (!parsed.success) return fail("Invalid input");

  try {
    await adminWithdrawalAction(
      session.user.id,
      parsed.data.withdrawalId,
      parsed.data.action,
      parsed.data.note
    );
    revalidateAdmin();
    return { ok: true };
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Action failed");
  }
}
