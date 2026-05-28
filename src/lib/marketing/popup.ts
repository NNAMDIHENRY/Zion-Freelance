import "server-only";

import { prisma } from "@/lib/db";

export async function getActivePlatformPopup(userId?: string) {
  if (!userId) return null;

  const popup = await prisma.platformPopup.findFirst({
    where: { enabled: true },
    orderBy: { updatedAt: "desc" }
  });
  if (!popup) return null;

  {
    const dismissed = await prisma.userPopupDismissal.findUnique({
      where: {
        userId_popupId: { userId, popupId: popup.id }
      }
    });
    if (dismissed && dismissed.version >= popup.version) return null;
  }

  return {
    id: popup.id,
    title: popup.title,
    body: popup.body,
    ctaText: popup.ctaText,
    ctaUrl: popup.ctaUrl,
    imageFileId: popup.imageFileId,
    version: popup.version
  };
}
