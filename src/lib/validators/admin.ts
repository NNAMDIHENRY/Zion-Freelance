import {
  AbuseReportCategory,
  AbuseReportSeverity,
  AbuseReportStatus,
  AbuseTargetType,
  AccountStatus,
  DisputeStatus,
  ProjectModerationStatus,
  Role,
  WithdrawalStatus
} from "@prisma/client";
import { z } from "zod";

export const adminUserListSchema = z.object({
  q: z.string().max(120).optional(),
  role: z.nativeEnum(Role).optional(),
  accountStatus: z.nativeEnum(AccountStatus).optional(),
  flagged: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(50).default(20)
});

export const adminUserActionSchema = z.object({
  userId: z.string().cuid(),
  action: z.enum(["suspend", "reactivate", "verify", "flag", "unflag", "restrict", "unrestrict"]),
  reason: z.string().max(500).optional()
});

export const adminProjectListSchema = z.object({
  moderationStatus: z.nativeEnum(ProjectModerationStatus).optional(),
  q: z.string().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(50).default(20)
});

export const adminProjectModerationSchema = z.object({
  projectId: z.string().cuid(),
  status: z.nativeEnum(ProjectModerationStatus),
  note: z.string().max(1000).optional()
});

export const adminDisputeListSchema = z.object({
  status: z.nativeEnum(DisputeStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(50).default(20)
});

export const adminDisputeResolveSchema = z.object({
  disputeId: z.string().cuid(),
  status: z.enum([DisputeStatus.RESOLVED, DisputeStatus.DISMISSED, DisputeStatus.ESCALATED, DisputeStatus.UNDER_REVIEW]),
  resolution: z.string().max(2000).optional()
});

export const adminPaymentListSchema = z.object({
  status: z.string().optional(),
  type: z.string().optional(),
  userId: z.string().cuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(50).default(20)
});

export const adminWithdrawalActionSchema = z.object({
  withdrawalId: z.string().cuid(),
  action: z.enum(["approve", "reject", "review", "unflag"]),
  note: z.string().max(500).optional()
});

export const adminReportListSchema = z.object({
  status: z.nativeEnum(AbuseReportStatus).optional(),
  severity: z.nativeEnum(AbuseReportSeverity).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(50).default(20)
});

export const adminReportResolveSchema = z.object({
  reportId: z.string().cuid(),
  status: z.nativeEnum(AbuseReportStatus),
  resolutionNote: z.string().max(2000).optional(),
  severity: z.nativeEnum(AbuseReportSeverity).optional()
});

export const submitAbuseReportSchema = z.object({
  category: z.nativeEnum(AbuseReportCategory),
  targetType: z.nativeEnum(AbuseTargetType),
  targetId: z.string().min(1).max(64),
  description: z.string().min(10).max(2000)
});

export const platformPopupSchema = z.object({
  id: z.string().cuid().optional(),
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(2).max(4000),
  ctaText: z.string().trim().max(80).optional().or(z.literal("")),
  ctaUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  imageFileId: z.string().cuid().optional().or(z.literal("")),
  enabled: z.boolean().default(false)
});

export const platformBannerSchema = z.object({
  id: z.string().cuid().optional(),
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(2).max(500),
  ctaText: z.string().trim().max(80).optional().or(z.literal("")),
  ctaUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  imageFileId: z.string().cuid().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  enabled: z.boolean().default(false)
});
