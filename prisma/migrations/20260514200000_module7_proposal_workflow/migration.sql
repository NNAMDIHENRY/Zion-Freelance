-- Proposal workflow: extend status enum, rename columns, delivery days, withdrawal timestamp.

ALTER TYPE "ProposalStatus" ADD VALUE 'REVIEWED';

ALTER TABLE "Proposal" RENAME COLUMN "message" TO "coverLetter";
ALTER TABLE "Proposal" RENAME COLUMN "bidAmount" TO "proposedPrice";

ALTER TABLE "Proposal" ADD COLUMN "deliveryDays" INTEGER;

UPDATE "Proposal"
SET
  "deliveryDays" = CASE
    WHEN "deliveryEta" IS NOT NULL THEN GREATEST(
      1,
      CEIL(EXTRACT(EPOCH FROM ("deliveryEta" - "createdAt")) / 86400.0)::integer
    )
    ELSE NULL
  END
WHERE TRUE;

ALTER TABLE "Proposal" DROP COLUMN "deliveryEta";

ALTER TABLE "Proposal" ADD COLUMN "withdrawnAt" TIMESTAMP(3);

UPDATE "Proposal"
SET "withdrawnAt" = "updatedAt"
WHERE "status" = 'WITHDRAWN' AND "withdrawnAt" IS NULL;
