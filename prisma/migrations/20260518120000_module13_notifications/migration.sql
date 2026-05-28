-- Module 13: enterprise notifications

CREATE TYPE "NotificationCategory" AS ENUM (
  'PROPOSAL',
  'CONTRACT',
  'MILESTONE',
  'PAYMENT',
  'ESCROW',
  'WITHDRAWAL',
  'MESSAGE',
  'REVIEW',
  'DISPUTE',
  'SYSTEM',
  'SECURITY'
);

CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'MILESTONE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DISPUTE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SECURITY';

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "unreadNotificationCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "category" "NotificationCategory";
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL';
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

UPDATE "Notification" SET "category" = CASE "type"::text
  WHEN 'MESSAGE' THEN 'MESSAGE'::"NotificationCategory"
  WHEN 'PROPOSAL' THEN 'PROPOSAL'::"NotificationCategory"
  WHEN 'CONTRACT' THEN 'CONTRACT'::"NotificationCategory"
  WHEN 'MILESTONE' THEN 'MILESTONE'::"NotificationCategory"
  WHEN 'PAYMENT' THEN 'PAYMENT'::"NotificationCategory"
  WHEN 'ESCROW' THEN 'ESCROW'::"NotificationCategory"
  WHEN 'WITHDRAWAL' THEN 'WITHDRAWAL'::"NotificationCategory"
  WHEN 'REVIEW' THEN 'REVIEW'::"NotificationCategory"
  WHEN 'DISPUTE' THEN 'DISPUTE'::"NotificationCategory"
  WHEN 'SECURITY' THEN 'SECURITY'::"NotificationCategory"
  ELSE 'SYSTEM'::"NotificationCategory"
END
WHERE "category" IS NULL;

ALTER TABLE "Notification" ALTER COLUMN "category" SET NOT NULL;

UPDATE "User" u
SET "unreadNotificationCount" = (
  SELECT COUNT(*)::int FROM "Notification" n
  WHERE n."userId" = u.id AND n.read = false AND n."archivedAt" IS NULL
);

CREATE TABLE IF NOT EXISTS "NotificationPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "category" "NotificationCategory" NOT NULL,
  "inApp" BOOLEAN NOT NULL DEFAULT true,
  "email" BOOLEAN NOT NULL DEFAULT true,
  "realtime" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "NotificationPreference_userId_category_key"
  ON "NotificationPreference"("userId", "category");
CREATE INDEX IF NOT EXISTS "NotificationPreference_userId_idx"
  ON "NotificationPreference"("userId");

ALTER TABLE "NotificationPreference"
  ADD CONSTRAINT "NotificationPreference_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Notification_userId_archivedAt_createdAt_idx"
  ON "Notification"("userId", "archivedAt", "createdAt");
CREATE INDEX IF NOT EXISTS "Notification_userId_category_createdAt_idx"
  ON "Notification"("userId", "category", "createdAt");
