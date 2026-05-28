-- AlterTable
ALTER TABLE "ConversationParticipant" ADD COLUMN "typingAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN "proposalId" TEXT;

CREATE UNIQUE INDEX "Conversation_proposalId_key" ON "Conversation"("proposalId");

ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_proposalId_fkey"
  FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
