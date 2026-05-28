-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'FUNDED', 'ACTIVE', 'SUBMITTED', 'APPROVED', 'RELEASED');

-- AlterEnum
ALTER TYPE "EscrowStatus" ADD VALUE 'PARTIALLY_FUNDED';

-- AlterEnum
ALTER TYPE "PaymentProvider" ADD VALUE 'FLUTTERWAVE';

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "completionNote" TEXT,
ADD COLUMN     "deliveryDays" INTEGER,
ADD COLUMN     "deliveryTerms" TEXT;

-- CreateTable
CREATE TABLE "ContractMilestone" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(19,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "dueDate" TIMESTAMP(3),
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "contractId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContractMilestone_contractId_sortOrder_idx" ON "ContractMilestone"("contractId", "sortOrder");

-- CreateIndex
CREATE INDEX "ContractMilestone_contractId_status_idx" ON "ContractMilestone"("contractId", "status");

-- AddForeignKey
ALTER TABLE "ContractMilestone" ADD CONSTRAINT "ContractMilestone_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
