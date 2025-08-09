/*
  Warnings:

  - A unique constraint covering the columns `[publicId]` on the table `IssuanceLog` will be added. If there are existing duplicate values, this will fail.
  - The required column `publicId` was added to the `IssuanceLog` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "public"."IssuanceLog" ADD COLUMN     "publicId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "IssuanceLog_publicId_key" ON "public"."IssuanceLog"("publicId");

-- CreateIndex
CREATE INDEX "IssuanceLog_credentialId_idx" ON "public"."IssuanceLog"("credentialId");
