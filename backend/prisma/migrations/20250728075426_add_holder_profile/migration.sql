-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('issuer_admin', 'platform_admin');

-- CreateEnum
CREATE TYPE "InstitutionStatus" AS ENUM ('PENDING_EMAIL_VERIFICATION', 'PENDING_ADMIN_VERIFICATION', 'ACTIVE', 'REJECTED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "userType" "UserType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "institutionId" INTEGER,
    "resetPasswordToken" TEXT,
    "resetPasswordExpires" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Institution" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "officialEmail" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "address" TEXT,
    "status" "InstitutionStatus" NOT NULL DEFAULT 'PENDING_EMAIL_VERIFICATION',
    "verificationDocumentUrl" TEXT,
    "rejectionReason" TEXT,
    "emailVerificationToken" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "issuanceCredits" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HolderProfile" (
    "walletAddress" TEXT NOT NULL,
    "name" TEXT,
    "bio" TEXT,
    "profilePictureUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HolderProfile_pkey" PRIMARY KEY ("walletAddress")
);

-- CreateTable
CREATE TABLE "CredentialTemplate" (
    "id" SERIAL NOT NULL,
    "institutionId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ipfsTemplateHash" TEXT,
    "dynamicFields" JSONB,

    CONSTRAINT "CredentialTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssuanceLog" (
    "id" SERIAL NOT NULL,
    "credentialId" BIGINT NOT NULL,
    "templateId" INTEGER NOT NULL,
    "recipientAddress" TEXT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssuanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionLog" (
    "id" SERIAL NOT NULL,
    "txHash" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "credentialId" BIGINT,

    CONSTRAINT "TransactionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentLog" (
    "id" SERIAL NOT NULL,
    "xenditId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "userId" INTEGER,

    CONSTRAINT "PaymentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_institutionId_key" ON "User"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "Institution_officialEmail_key" ON "Institution"("officialEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Institution_emailVerificationToken_key" ON "Institution"("emailVerificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "HolderProfile_walletAddress_key" ON "HolderProfile"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "IssuanceLog_transactionHash_key" ON "IssuanceLog"("transactionHash");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionLog_txHash_key" ON "TransactionLog"("txHash");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentLog_xenditId_key" ON "PaymentLog"("xenditId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CredentialTemplate" ADD CONSTRAINT "CredentialTemplate_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssuanceLog" ADD CONSTRAINT "IssuanceLog_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CredentialTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
