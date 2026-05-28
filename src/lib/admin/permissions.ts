import "server-only";

import { Role } from "@prisma/client";

import { requireRole } from "@/lib/auth/guard";

/** Extensible permission keys for future sub-roles (finance, trust & safety, etc.). */
export const AdminPermission = {
  PLATFORM_READ: "platform:read",
  USERS_MANAGE: "users:manage",
  PROJECTS_MODERATE: "projects:moderate",
  DISPUTES_RESOLVE: "disputes:resolve",
  PAYMENTS_MONITOR: "payments:monitor",
  WITHDRAWALS_APPROVE: "withdrawals:approve",
  REPORTS_MODERATE: "reports:moderate",
  AUDIT_READ: "audit:read"
} as const;

export type AdminPermissionKey = (typeof AdminPermission)[keyof typeof AdminPermission];

const ROLE_PERMISSIONS: Record<Role, readonly AdminPermissionKey[]> = {
  [Role.ADMIN]: Object.values(AdminPermission),
  [Role.CLIENT]: [],
  [Role.FREELANCER]: []
};

export function roleHasPermission(role: Role, permission: AdminPermissionKey): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function assertAdminPermission(role: Role, permission: AdminPermissionKey) {
  if (!roleHasPermission(role, permission)) {
    throw new Error("Forbidden");
  }
}

export async function requireAdmin(permission?: AdminPermissionKey) {
  const session = await requireRole([Role.ADMIN]);
  if (permission) {
    assertAdminPermission(session.user.role as Role, permission);
  }
  return session;
}
