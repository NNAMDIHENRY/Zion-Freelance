import "server-only";

import { prisma } from "@/lib/db";

export async function listPlatformPopups() {
  return prisma.platformPopup.findMany({ orderBy: { updatedAt: "desc" } });
}

export async function listPlatformBanners() {
  return prisma.platformBanner.findMany({ orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }] });
}
