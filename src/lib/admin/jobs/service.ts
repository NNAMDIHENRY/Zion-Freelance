import "server-only";

import { JobStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import type { AdminJobRow } from "@/components/admin/JobModerationTable";

export async function listAdminJobs(input: {
  page: number;
  pageSize: number;
  status?: JobStatus;
  q?: string;
}) {
  const skip = (input.page - 1) * input.pageSize;
  const where: Prisma.JobWhereInput = {};
  if (input.status) where.status = input.status;
  if (input.q?.trim()) {
    where.title = { contains: input.q.trim(), mode: "insensitive" };
  }

  const [total, rows] = await Promise.all([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      skip,
      take: input.pageSize,
      orderBy: { createdAt: "desc" },
      include: { poster: { select: { name: true } } }
    })
  ]);

  const items: AdminJobRow[] = rows.map((j) => ({
    id: j.id,
    title: j.title,
    slug: j.slug,
    status: j.status,
    companyName: j.companyName,
    posterName: j.poster.name,
    applicationCount: j.applicationCount,
    viewCount: j.viewCount,
    featured: j.featured,
    createdAt: j.createdAt.toISOString()
  }));

  return {
    items,
    total,
    page: input.page,
    pageSize: input.pageSize,
    totalPages: Math.max(1, Math.ceil(total / input.pageSize))
  };
}

export async function listPendingModerationJobs() {
  return listAdminJobs({ page: 1, pageSize: 50, status: JobStatus.PENDING });
}
