-- CreateEnum
CREATE TYPE "FreelancerPlanTier" AS ENUM ('FREE', 'PLUS', 'PRO');

-- AlterTable
ALTER TABLE "FreelancerProfile" ADD COLUMN     "planExpiresAt" TIMESTAMP(3);
