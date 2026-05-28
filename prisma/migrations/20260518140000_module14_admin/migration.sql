-- Module 14: admin moderation & platform management

CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'RESTRICTED');

CREATE TYPE "ProjectModerationStatus" AS ENUM (
  'ACTIVE',
  'FLAGGED',
  'UNDER_REVIEW',
  'FROZEN',
  'REMOVED'
);

CREATE TYPE "DisputeStatus" AS ENUM (
  'OPEN',
  'UNDER_REVIEW',
  'ESCALATED',
  'RESOLVED',
  'DISMISSED'
);

CREATE TYPE "AbuseReportCategory" AS ENUM (
  'FRAUD',
  'SPAM',
  'ABUSE',
  'FAKE_PROJECT',
  'PAYMENT_MISCONDUCT',
  'OTHER'
);

CREATE TYPE "AbuseReportSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TYPE "AbuseReportStatus" AS ENUM (
  'OPEN',
  'UNDER_REVIEW',
  'RESOLVED',
  'DISMISSED',
  'ARCHIVED'
);

CREATE TYPE "AbuseTargetType" AS ENUM ('USER', 'PROJECT', 'PAYMENT', 'MESSAGE');

ALTER TYPE "WithdrawalStatus" ADD VALUE IF NOT EXISTS 'UNDER_REVIEW';

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "moderationFlag" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "suspendReason" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "restrictedUntil" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "User_accountStatus_moderationFlag_idx" ON "User"("accountStatus", "moderationFlag");

ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "moderationStatus" "ProjectModerationStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "moderationNote" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "moderatedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Project_moderationStatus_createdAt_idx" ON "Project"("moderationStatus", "createdAt");

ALTER TABLE "WithdrawalRequest" ADD COLUMN IF NOT EXISTS "reviewedByAdminId" TEXT;
ALTER TABLE "WithdrawalRequest" ADD COLUMN IF NOT EXISTS "flaggedForReview" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "Dispute" (
  "id" TEXT NOT NULL,
  "contractId" TEXT NOT NULL,
  "openedByUserId" TEXT NOT NULL,
  "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
  "reason" TEXT NOT NULL,
  "resolution" TEXT,
  "evidence" JSONB,
  "resolvedById" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Dispute_contractId_key" ON "Dispute"("contractId");
CREATE INDEX "Dispute_status_createdAt_idx" ON "Dispute"("status", "createdAt");
CREATE INDEX "Dispute_openedByUserId_idx" ON "Dispute"("openedByUserId");

ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_openedByUserId_fkey" FOREIGN KEY ("openedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "AbuseReport" (
  "id" TEXT NOT NULL,
  "reporterId" TEXT NOT NULL,
  "category" "AbuseReportCategory" NOT NULL,
  "severity" "AbuseReportSeverity" NOT NULL DEFAULT 'MEDIUM',
  "status" "AbuseReportStatus" NOT NULL DEFAULT 'OPEN',
  "targetType" "AbuseTargetType" NOT NULL,
  "targetId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "resolutionNote" TEXT,
  "assignedAdminId" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AbuseReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AbuseReport_status_severity_createdAt_idx" ON "AbuseReport"("status", "severity", "createdAt");
CREATE INDEX "AbuseReport_targetType_targetId_idx" ON "AbuseReport"("targetType", "targetId");
CREATE INDEX "AbuseReport_reporterId_idx" ON "AbuseReport"("reporterId");

ALTER TABLE "AbuseReport" ADD CONSTRAINT "AbuseReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AbuseReport" ADD CONSTRAINT "AbuseReport_assignedAdminId_fkey" FOREIGN KEY ("assignedAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "AdminAuditLog" (
  "id" TEXT NOT NULL,
  "adminUserId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "beforeState" JSONB,
  "afterState" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminAuditLog_adminUserId_createdAt_idx" ON "AdminAuditLog"("adminUserId", "createdAt");
CREATE INDEX "AdminAuditLog_entityType_entityId_idx" ON "AdminAuditLog"("entityType", "entityId");
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
