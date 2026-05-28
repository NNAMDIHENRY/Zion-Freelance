/*
  Warnings:

  - The `planTier` column on the `FreelancerProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "FreelancerProfile" DROP COLUMN "planTier",
ADD COLUMN     "planTier" "FreelancerPlanTier" NOT NULL DEFAULT 'FREE';
