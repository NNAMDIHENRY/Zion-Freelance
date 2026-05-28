import "server-only";

import { AccountStatus, Prisma, Role } from "@prisma/client";

import { recordAdminAudit } from "@/lib/admin/audit";
import { prisma } from "@/lib/db";
import type { adminUserListSchema } from "@/lib/validators/admin";
import type { z } from "zod";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  accountStatus: AccountStatus;
  moderationFlag: boolean;
  verified: boolean;
  emailVerified: boolean;
  walletBalance: string | null;
  createdAt: string;
  suspendedAt: string | null;
};

type ListInput = z.infer<typeof adminUserListSchema>;

export async function listAdminUsers(input: ListInput) {
  const page = input.page;
  const pageSize = input.pageSize;
  const skip = (page - 1) * pageSize;

  const where: Prisma.UserWhereInput = {
    role: input.role ?? { not: Role.ADMIN }
  };
  if (input.accountStatus) where.accountStatus = input.accountStatus;
  if (input.flagged) where.moderationFlag = true;
  if (input.q?.trim()) {
    const q = input.q.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } }
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        moderationFlag: true,
        verifiedAt: true,
        emailVerified: true,
        suspendedAt: true,
        createdAt: true,
        wallet: { select: { balance: true, currency: true } }
      }
    })
  ]);

  const items: AdminUserRow[] = rows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    accountStatus: u.accountStatus,
    moderationFlag: u.moderationFlag,
    verified: Boolean(u.verifiedAt),
    emailVerified: Boolean(u.emailVerified),
    walletBalance: u.wallet
      ? `${u.wallet.balance.toString()} ${u.wallet.currency}`
      : null,
    createdAt: u.createdAt.toISOString(),
    suspendedAt: u.suspendedAt?.toISOString() ?? null
  }));

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

export async function moderateUserAccount(
  adminUserId: string,
  userId: string,
  action: "suspend" | "reactivate" | "verify" | "flag" | "unflag" | "restrict" | "unrestrict",
  reason?: string
) {
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("User not found");
  if (target.role === Role.ADMIN) throw new Error("Cannot moderate admin accounts");

  const before = {
    accountStatus: target.accountStatus,
    moderationFlag: target.moderationFlag,
    verifiedAt: target.verifiedAt,
    suspendedAt: target.suspendedAt,
    restrictedUntil: target.restrictedUntil
  };

  let data: Prisma.UserUpdateInput = {};
  switch (action) {
    case "suspend":
      data = {
        accountStatus: AccountStatus.SUSPENDED,
        suspendedAt: new Date(),
        suspendReason: reason ?? "Suspended by admin"
      };
      break;
    case "reactivate":
      data = {
        accountStatus: AccountStatus.ACTIVE,
        suspendedAt: null,
        suspendReason: null,
        restrictedUntil: null
      };
      break;
    case "verify":
      data = { verifiedAt: new Date() };
      break;
    case "flag":
      data = { moderationFlag: true };
      break;
    case "unflag":
      data = { moderationFlag: false };
      break;
    case "restrict":
      data = {
        accountStatus: AccountStatus.RESTRICTED,
        restrictedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };
      break;
    case "unrestrict":
      data = { accountStatus: AccountStatus.ACTIVE, restrictedUntil: null };
      break;
  }

  const updated = await prisma.user.update({ where: { id: userId }, data });

  await recordAdminAudit({
    adminUserId,
    action: `user.${action}`,
    entityType: "User",
    entityId: userId,
    beforeState: before,
    afterState: {
      accountStatus: updated.accountStatus,
      moderationFlag: updated.moderationFlag,
      verifiedAt: updated.verifiedAt,
      suspendedAt: updated.suspendedAt,
      restrictedUntil: updated.restrictedUntil
    }
  });

  return updated;
}
