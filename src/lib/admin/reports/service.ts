import "server-only";

import { AbuseReportStatus, Prisma } from "@prisma/client";

import { recordAdminAudit } from "@/lib/admin/audit";
import { assertAbuseReportTransition } from "@/lib/admin/transitions";
import { prisma } from "@/lib/db";
import type { adminReportListSchema } from "@/lib/validators/admin";
import type { z } from "zod";

export type AdminAbuseReportRow = {
  id: string;
  category: string;
  severity: string;
  status: AbuseReportStatus;
  targetType: string;
  targetId: string;
  description: string;
  reporterName: string;
  createdAt: string;
};

type ListInput = z.infer<typeof adminReportListSchema>;

export async function listAbuseReports(input: ListInput) {
  const page = input.page;
  const pageSize = input.pageSize;
  const skip = (page - 1) * pageSize;

  const where: Prisma.AbuseReportWhereInput = {};
  if (input.status) where.status = input.status;
  if (input.severity) where.severity = input.severity;

  const [total, rows] = await Promise.all([
    prisma.abuseReport.count({ where }),
    prisma.abuseReport.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      include: { reporter: { select: { name: true } } }
    })
  ]);

  const items: AdminAbuseReportRow[] = rows.map((r) => ({
    id: r.id,
    category: r.category,
    severity: r.severity,
    status: r.status,
    targetType: r.targetType,
    targetId: r.targetId,
    description: r.description,
    reporterName: r.reporter.name,
    createdAt: r.createdAt.toISOString()
  }));

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function resolveAbuseReport(
  adminUserId: string,
  reportId: string,
  status: AbuseReportStatus,
  resolutionNote?: string,
  severity?: import("@prisma/client").AbuseReportSeverity
) {
  const report = await prisma.abuseReport.findUnique({ where: { id: reportId } });
  if (!report) throw new Error("Report not found");

  assertAbuseReportTransition(report.status, status);

  const before = { status: report.status, resolutionNote: report.resolutionNote };
  const updated = await prisma.abuseReport.update({
    where: { id: reportId },
    data: {
      status,
      severity: severity ?? report.severity,
      resolutionNote: resolutionNote ?? report.resolutionNote,
      assignedAdminId: adminUserId,
      resolvedAt:
        status === AbuseReportStatus.RESOLVED || status === AbuseReportStatus.DISMISSED
          ? new Date()
          : report.resolvedAt,
      archivedAt: status === AbuseReportStatus.ARCHIVED ? new Date() : report.archivedAt
    }
  });

  await recordAdminAudit({
    adminUserId,
    action: "report.resolve",
    entityType: "AbuseReport",
    entityId: reportId,
    beforeState: before,
    afterState: { status: updated.status, resolutionNote: updated.resolutionNote }
  });

  return updated;
}

export async function submitAbuseReport(
  reporterId: string,
  input: {
    category: import("@prisma/client").AbuseReportCategory;
    targetType: import("@prisma/client").AbuseTargetType;
    targetId: string;
    description: string;
  }
) {
  return prisma.abuseReport.create({
    data: {
      reporterId,
      category: input.category,
      targetType: input.targetType,
      targetId: input.targetId,
      description: input.description
    }
  });
}
