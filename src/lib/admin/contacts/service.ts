import "server-only";

import { prisma } from "@/lib/db";

export async function listRegistrationContacts(params: {
  page?: number;
  pageSize?: number;
  q?: string;
}) {
  const page = params.page ?? 1;
  const pageSize = Math.min(params.pageSize ?? 25, 100);
  const skip = (page - 1) * pageSize;

  const where = params.q
    ? {
        OR: [
          { email: { contains: params.q, mode: "insensitive" as const } },
          { phone: { contains: params.q, mode: "insensitive" as const } },
          { city: { contains: params.q, mode: "insensitive" as const } },
          { user: { name: { contains: params.q, mode: "insensitive" as const } } }
        ]
      }
    : {};

  const [total, rows] = await Promise.all([
    prisma.userRegistrationContact.count({ where }),
    prisma.userRegistrationContact.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, role: true, createdAt: true } }
      }
    })
  ]);

  return {
    items: rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      name: r.user.name,
      role: r.user.role,
      email: r.email,
      phone: r.phone,
      country: r.country,
      city: r.city,
      referralSource: r.referralSource,
      registeredAt: r.createdAt.toISOString()
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}
