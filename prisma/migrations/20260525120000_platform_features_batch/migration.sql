-- AlterTable User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "allowMessagesFromEveryone" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tutorialClientCompletedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tutorialFreelancerCompletedAt" TIMESTAMP(3);

-- AlterTable ClientProfile
ALTER TABLE "ClientProfile" ADD COLUMN IF NOT EXISTS "bio" TEXT;
ALTER TABLE "ClientProfile" ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "ClientProfile" ADD COLUMN IF NOT EXISTS "profileViewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable FreelancerProfile
ALTER TABLE "FreelancerProfile" ADD COLUMN IF NOT EXISTS "profileViewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable Conversation
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "directKey" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Conversation_directKey_key" ON "Conversation"("directKey");

-- AlterTable Message
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "deletedById" TEXT;
CREATE INDEX IF NOT EXISTS "Message_conversationId_isDeleted_idx" ON "Message"("conversationId", "isDeleted");

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'VERIFIED', 'DECLINED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable EmailVerificationToken
CREATE TABLE IF NOT EXISTS "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "EmailVerificationToken_userId_expiresAt_idx" ON "EmailVerificationToken"("userId", "expiresAt");
CREATE INDEX IF NOT EXISTS "EmailVerificationToken_tokenHash_idx" ON "EmailVerificationToken"("tokenHash");
ALTER TABLE "EmailVerificationToken" DROP CONSTRAINT IF EXISTS "EmailVerificationToken_userId_fkey";
ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable FreelancerCertification
CREATE TABLE IF NOT EXISTS "FreelancerCertification" (
    "id" TEXT NOT NULL,
    "freelancerProfileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expirationDate" TIMESTAMP(3),
    "credentialUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FreelancerCertification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FreelancerCertification_freelancerProfileId_issueDate_idx" ON "FreelancerCertification"("freelancerProfileId", "issueDate");
ALTER TABLE "FreelancerCertification" DROP CONSTRAINT IF EXISTS "FreelancerCertification_freelancerProfileId_fkey";
ALTER TABLE "FreelancerCertification" ADD CONSTRAINT "FreelancerCertification_freelancerProfileId_fkey" FOREIGN KEY ("freelancerProfileId") REFERENCES "FreelancerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable PlatformPopup
CREATE TABLE IF NOT EXISTS "PlatformPopup" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "ctaUrl" TEXT,
    "imageFileId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlatformPopup_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PlatformPopup_enabled_updatedAt_idx" ON "PlatformPopup"("enabled", "updatedAt");

-- CreateTable UserPopupDismissal
CREATE TABLE IF NOT EXISTS "UserPopupDismissal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "popupId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserPopupDismissal_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserPopupDismissal_userId_popupId_key" ON "UserPopupDismissal"("userId", "popupId");
CREATE INDEX IF NOT EXISTS "UserPopupDismissal_popupId_idx" ON "UserPopupDismissal"("popupId");
ALTER TABLE "UserPopupDismissal" DROP CONSTRAINT IF EXISTS "UserPopupDismissal_userId_fkey";
ALTER TABLE "UserPopupDismissal" ADD CONSTRAINT "UserPopupDismissal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserPopupDismissal" DROP CONSTRAINT IF EXISTS "UserPopupDismissal_popupId_fkey";
ALTER TABLE "UserPopupDismissal" ADD CONSTRAINT "UserPopupDismissal_popupId_fkey" FOREIGN KEY ("popupId") REFERENCES "PlatformPopup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable PlatformBanner
CREATE TABLE IF NOT EXISTS "PlatformBanner" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "ctaUrl" TEXT,
    "imageFileId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlatformBanner_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PlatformBanner_enabled_sortOrder_idx" ON "PlatformBanner"("enabled", "sortOrder");

-- CreateTable UserBannerDismissal
CREATE TABLE IF NOT EXISTS "UserBannerDismissal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bannerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserBannerDismissal_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserBannerDismissal_userId_bannerId_key" ON "UserBannerDismissal"("userId", "bannerId");
CREATE INDEX IF NOT EXISTS "UserBannerDismissal_bannerId_idx" ON "UserBannerDismissal"("bannerId");
ALTER TABLE "UserBannerDismissal" DROP CONSTRAINT IF EXISTS "UserBannerDismissal_userId_fkey";
ALTER TABLE "UserBannerDismissal" ADD CONSTRAINT "UserBannerDismissal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserBannerDismissal" DROP CONSTRAINT IF EXISTS "UserBannerDismissal_bannerId_fkey";
ALTER TABLE "UserBannerDismissal" ADD CONSTRAINT "UserBannerDismissal_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "PlatformBanner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable ProfileView
CREATE TABLE IF NOT EXISTS "ProfileView" (
    "id" TEXT NOT NULL,
    "viewedUserId" TEXT NOT NULL,
    "viewerUserId" TEXT,
    "viewerHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProfileView_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ProfileView_viewedUserId_createdAt_idx" ON "ProfileView"("viewedUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "ProfileView_viewerHash_viewedUserId_createdAt_idx" ON "ProfileView"("viewerHash", "viewedUserId", "createdAt");
ALTER TABLE "ProfileView" DROP CONSTRAINT IF EXISTS "ProfileView_viewedUserId_fkey";
ALTER TABLE "ProfileView" ADD CONSTRAINT "ProfileView_viewedUserId_fkey" FOREIGN KEY ("viewedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProfileView" DROP CONSTRAINT IF EXISTS "ProfileView_viewerUserId_fkey";
ALTER TABLE "ProfileView" ADD CONSTRAINT "ProfileView_viewerUserId_fkey" FOREIGN KEY ("viewerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable KycSubmission
CREATE TABLE IF NOT EXISTS "KycSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "whatsappNumber" TEXT,
    "documentType" TEXT,
    "documentNumber" TEXT,
    "paymentId" TEXT,
    "declineReason" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "renewalPaidAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "KycSubmission_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "KycSubmission_userId_key" ON "KycSubmission"("userId");
CREATE INDEX IF NOT EXISTS "KycSubmission_status_createdAt_idx" ON "KycSubmission"("status", "createdAt");
ALTER TABLE "KycSubmission" DROP CONSTRAINT IF EXISTS "KycSubmission_userId_fkey";
ALTER TABLE "KycSubmission" ADD CONSTRAINT "KycSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
