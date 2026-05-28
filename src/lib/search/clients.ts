import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import type { PaginatedResult } from "@/lib/search/types";

export type ClientSearchRow = {
  userId: string;
  name: string;
  companyName: string | null;
  bioPreview: string | null;
  projectCount: number;
  profileViewCount: number;
};

export async function searchClients(input: {
  q?: string;
  page: number;
  pageSize: number;
}): Promise<PaginatedResult<ClientSearchRow>> {
  const and: Prisma.ClientProfileWhereInput[] = [{ isPublic: true }];

  if (input.q) {
    const q = input.q;
    and.push({
      OR: [
        { companyName: { contains: q, mode: "insensitive" } },
        { bio: { contains: q, mode: "insensitive" } },
        { user: { name: { contains: q, mode: "insensitive" } } }
      ]
    });
  }

  const where = { AND: and };
  const skip = (input.page - 1) * input.pageSize;

  const [total, rows] = await Promise.all([
    prisma.clientProfile.count({ where }),
    prisma.clientProfile.findMany({
      where,
      skip,
      take: input.pageSize,
      orderBy: [{ profileViewCount: "desc" }, { createdAt: "desc" }],
      select: {
        companyName: true,
        bio: true,
        profileViewCount: true,
        user: { select: { id: true, name: true } },
        _count: { select: { projects: true } }
      }
    })
  ]);

  return {
    items: rows.map((r) => ({
      userId: r.user.id,
      name: r.user.name,
      companyName: r.companyName,
      bioPreview: r.bio ? (r.bio.length > 140 ? `${r.bio.slice(0, 137)}…` : r.bio) : null,
      projectCount: r._count.projects,
      profileViewCount: r.profileViewCount
    })),
    total,
    page: input.page,
    pageSize: input.pageSize,
    totalPages: Math.max(1, Math.ceil(total / input.pageSize))
  };
}
