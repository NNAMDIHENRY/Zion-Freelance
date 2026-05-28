import "server-only";

import { KycStatus } from "@prisma/client";

import { prisma } from "@/lib/db";

export async function getKycStatusForUser(userId: string) {
  const [user, kyc] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { verifiedAt: true }
    }),
    prisma.kycSubmission.findUnique({ where: { userId } })
  ]);

  return {
    identityVerified: !!user?.verifiedAt,
    submission: kyc,
    canSubmit:
      !user?.verifiedAt &&
      (!kyc || kyc.status === KycStatus.DECLINED || kyc.status === KycStatus.EXPIRED)
  };
}
