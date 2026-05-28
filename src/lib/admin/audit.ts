import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

export type AuditPayload = {
  adminUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeState?: Prisma.InputJsonValue;
  afterState?: Prisma.InputJsonValue;
};

export async function recordAdminAudit(payload: AuditPayload) {
  return prisma.adminAuditLog.create({
    data: {
      adminUserId: payload.adminUserId,
      action: payload.action,
      entityType: payload.entityType,
      entityId: payload.entityId,
      beforeState: payload.beforeState,
      afterState: payload.afterState
    }
  });
}

export async function listRecentAuditLogs(limit = 50) {
  return prisma.adminAuditLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      admin: { select: { id: true, name: true, email: true } }
    }
  });
}
