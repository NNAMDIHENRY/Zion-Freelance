import "server-only";

import { ContractStatus, DisputeStatus, Prisma } from "@prisma/client";

import { recordAdminAudit } from "@/lib/admin/audit";
import { assertDisputeTransition } from "@/lib/admin/transitions";
import { prisma } from "@/lib/db";
import type { adminDisputeListSchema } from "@/lib/validators/admin";
import type { z } from "zod";

export type AdminDisputeRow = {
  id: string;
  status: DisputeStatus;
  reason: string;
  resolution: string | null;
  contractId: string;
  projectTitle: string;
  openedByName: string;
  createdAt: string;
  evidence: unknown;
};

type ListInput = z.infer<typeof adminDisputeListSchema>;

export async function listAdminDisputes(input: ListInput) {
  const page = input.page;
  const pageSize = input.pageSize;
  const skip = (page - 1) * pageSize;

  const where: Prisma.DisputeWhereInput = {};
  if (input.status) where.status = input.status;

  const [total, rows] = await Promise.all([
    prisma.dispute.count({ where }),
    prisma.dispute.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        openedBy: { select: { name: true } },
        contract: {
          include: { project: { select: { title: true } } }
        }
      }
    })
  ]);

  const items: AdminDisputeRow[] = rows.map((d) => ({
    id: d.id,
    status: d.status,
    reason: d.reason,
    resolution: d.resolution,
    contractId: d.contractId,
    projectTitle: d.contract.project.title,
    openedByName: d.openedBy.name,
    createdAt: d.createdAt.toISOString(),
    evidence: d.evidence
  }));

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function updateDisputeStatus(
  adminUserId: string,
  disputeId: string,
  status: DisputeStatus,
  resolution?: string
) {
  const dispute = await prisma.dispute.findUnique({ where: { id: disputeId } });
  if (!dispute) throw new Error("Dispute not found");

  assertDisputeTransition(dispute.status, status);

  const before = { status: dispute.status, resolution: dispute.resolution };
  const isTerminal =
    status === DisputeStatus.RESOLVED || status === DisputeStatus.DISMISSED;

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.dispute.update({
      where: { id: disputeId },
      data: {
        status,
        resolution: resolution ?? dispute.resolution,
        resolvedById: isTerminal ? adminUserId : dispute.resolvedById,
        resolvedAt: isTerminal ? new Date() : dispute.resolvedAt
      }
    });

    if (isTerminal) {
      await tx.contract.update({
        where: { id: dispute.contractId },
        data: {
          status:
            status === DisputeStatus.RESOLVED
              ? ContractStatus.ACTIVE
              : ContractStatus.TERMINATED
        }
      });
    } else if (status === DisputeStatus.ESCALATED || status === DisputeStatus.UNDER_REVIEW) {
      await tx.contract.update({
        where: { id: dispute.contractId },
        data: { status: ContractStatus.DISPUTED }
      });
    }

    return row;
  });

  await recordAdminAudit({
    adminUserId,
    action: "dispute.update",
    entityType: "Dispute",
    entityId: disputeId,
    beforeState: before,
    afterState: { status: updated.status, resolution: updated.resolution }
  });

  return updated;
}
