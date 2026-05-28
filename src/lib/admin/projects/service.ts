import "server-only";

import { Prisma, ProjectModerationStatus, ProjectStatus } from "@prisma/client";

import { recordAdminAudit } from "@/lib/admin/audit";
import { assertProjectModerationTransition } from "@/lib/admin/transitions";
import { prisma } from "@/lib/db";
import type { adminProjectListSchema } from "@/lib/validators/admin";
import type { z } from "zod";

export type AdminProjectRow = {
  id: string;
  title: string;
  status: ProjectStatus;
  moderationStatus: ProjectModerationStatus;
  clientName: string;
  proposalCount: number;
  createdAt: string;
  moderationNote: string | null;
};

type ListInput = z.infer<typeof adminProjectListSchema>;

export async function listAdminProjects(input: ListInput) {
  const page = input.page;
  const pageSize = input.pageSize;
  const skip = (page - 1) * pageSize;

  const where: Prisma.ProjectWhereInput = {};
  if (input.moderationStatus) where.moderationStatus = input.moderationStatus;
  if (input.q?.trim()) {
    where.title = { contains: input.q.trim(), mode: "insensitive" };
  }

  const [total, rows] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        client: { include: { user: { select: { name: true } } } },
        _count: { select: { proposals: true } }
      }
    })
  ]);

  const items: AdminProjectRow[] = rows.map((p) => ({
    id: p.id,
    title: p.title,
    status: p.status,
    moderationStatus: p.moderationStatus,
    clientName: p.client.user.name,
    proposalCount: p._count.proposals,
    createdAt: p.createdAt.toISOString(),
    moderationNote: p.moderationNote
  }));

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function setProjectModeration(
  adminUserId: string,
  projectId: string,
  status: ProjectModerationStatus,
  note?: string
) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error("Project not found");

  assertProjectModerationTransition(project.moderationStatus, status);

  const before = {
    moderationStatus: project.moderationStatus,
    moderationNote: project.moderationNote
  };

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: {
      moderationStatus: status,
      moderationNote: note ?? project.moderationNote,
      moderatedAt: new Date(),
      ...(status === ProjectModerationStatus.REMOVED
        ? { status: ProjectStatus.CLOSED }
        : {})
    }
  });

  await recordAdminAudit({
    adminUserId,
    action: "project.moderation",
    entityType: "Project",
    entityId: projectId,
    beforeState: before,
    afterState: {
      moderationStatus: updated.moderationStatus,
      moderationNote: updated.moderationNote
    }
  });

  return updated;
}
