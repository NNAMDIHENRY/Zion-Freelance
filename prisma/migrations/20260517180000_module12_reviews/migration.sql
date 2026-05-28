-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Review" ADD COLUMN "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Review" ADD COLUMN "projectId" TEXT;

-- Backfill projectId from contract
UPDATE "Review" r
SET "projectId" = c."projectId"
FROM "Contract" c
WHERE r."contractId" = c."id" AND r."projectId" IS NULL;

ALTER TABLE "Review" ALTER COLUMN "projectId" SET NOT NULL;

-- DropIndex
DROP INDEX IF EXISTS "Review_contractId_authorUserId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Review_authorUserId_projectId_subject_key" ON "Review"("authorUserId", "projectId", "subject");
CREATE INDEX "Review_subjectUserId_status_createdAt_idx" ON "Review"("subjectUserId", "status", "createdAt");
CREATE INDEX "Review_authorUserId_idx" ON "Review"("authorUserId");
CREATE INDEX "Review_projectId_idx" ON "Review"("projectId");
CREATE INDEX "Review_contractId_idx" ON "Review"("contractId");
CREATE INDEX "Review_status_createdAt_idx" ON "Review"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
