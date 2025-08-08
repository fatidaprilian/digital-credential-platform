/*
  Warnings:

  - A unique constraint covering the columns `[transactionHash,credentialId]` on the table `IssuanceLog` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."IssuanceLog_transactionHash_key";

-- CreateIndex
CREATE UNIQUE INDEX "IssuanceLog_transactionHash_credentialId_key" ON "public"."IssuanceLog"("transactionHash", "credentialId");
