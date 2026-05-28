import "server-only";

import { prisma } from "@/lib/db";

export async function getActivePlatformBanners() {
  return prisma.platformBanner.findMany({
    where: { enabled: true },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      body: true,
      ctaText: true,
      ctaUrl: true,
      imageFileId: true
    }
  });
}
