/*
  Warnings:

  - You are about to alter the column `winnings` on the `LeagueEntry` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `percentageShare` on the `PrizeDistribution` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(5,2)`.
  - You are about to alter the column `amount` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - The `status` column on the `Transaction` table would be dropped and recreated. This will lead to data loss if there is data in the column. -- Handled Manually Below
  - You are about to alter the column `balance` on the `Wallet` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `entryFee` on the `WeeklyLeague` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - Changed the type of `type` on the `Transaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required. -- Handled Manually Below

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'ENTRY_FEE', 'WINNINGS_PAYOUT', 'REFUND', 'ADJUSTMENT_CREDIT', 'ADJUSTMENT_DEBIT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'REQUIRES_APPROVAL', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- AlterTable - Keep these safe alterations from Prisma
ALTER TABLE "FplTeamCache" ALTER COLUMN "lastUpdated" DROP DEFAULT;
ALTER TABLE "GameweekCache" ALTER COLUMN "lastUpdated" DROP DEFAULT;
ALTER TABLE "LeagueEntry" ALTER COLUMN "winnings" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "updatedAt" DROP DEFAULT; -- Adjust if needed, usually @updatedAt handles this
ALTER TABLE "PrizeDistribution" ALTER COLUMN "percentageShare" SET DATA TYPE DECIMAL(5,2);
ALTER TABLE "Wallet" ALTER COLUMN "balance" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "currency" SET DEFAULT 'NGN';
ALTER TABLE "WeeklyLeague" ALTER COLUMN "entryFee" SET DATA TYPE DECIMAL(12,2);

-- AlterTable "Transaction" - Manual conversion for type and status --

-- 1. Change Amount Type (Keep this from Prisma)
ALTER TABLE "Transaction" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2);

-- 2. Handle 'type' column conversion
ALTER TABLE "Transaction" ADD COLUMN "type_new" "TransactionType";
-- Update based on YOUR distinct values
UPDATE "Transaction" SET "type_new" = CASE "type"
    WHEN 'entry_fee' THEN 'ENTRY_FEE'::"TransactionType"
    -- Since 'entry_fee' was the ONLY distinct value, we set others to NULL.
    -- If other types existed but should map to something else, add WHEN clauses here.
    ELSE NULL
END;
ALTER TABLE "Transaction" DROP COLUMN "type";
ALTER TABLE "Transaction" RENAME COLUMN "type_new" TO "type";
-- IMPORTANT: Check for NULLs before setting NOT NULL if your schema requires it.
-- Run this in Postico/psql: SELECT COUNT(*) FROM "Transaction" WHERE type IS NULL;
-- If count is 0, you can safely uncomment the next line. Otherwise, fix the NULLs first.
-- ALTER TABLE "Transaction" ALTER COLUMN "type" SET NOT NULL;

-- 3. Handle 'status' column conversion
ALTER TABLE "Transaction" ADD COLUMN "status_new" "TransactionStatus";
-- Update based on YOUR distinct values
UPDATE "Transaction" SET "status_new" = CASE "status"
    WHEN 'completed' THEN 'COMPLETED'::"TransactionStatus"
    WHEN 'pending' THEN 'PENDING'::"TransactionStatus"
    -- Since 'completed' and 'pending' were the ONLY distinct values, set others to NULL.
    -- If other statuses existed, add WHEN clauses here.
    ELSE NULL
END;
ALTER TABLE "Transaction" DROP COLUMN "status";
ALTER TABLE "Transaction" RENAME COLUMN "status_new" TO "status";
-- IMPORTANT: Check for NULLs before setting NOT NULL if your schema requires it.
-- Run this in Postico/psql: SELECT COUNT(*) FROM "Transaction" WHERE status IS NULL;
-- If count is 0, you can safely uncomment the next line. Otherwise, fix the NULLs first.
-- ALTER TABLE "Transaction" ALTER COLUMN "status" SET NOT NULL;
-- Set the default value specified in the schema
ALTER TABLE "Transaction" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- End Manual Transaction Alterations --


-- CreateTable UserBankAccount (Keep this from Prisma)
CREATE TABLE "UserBankAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "bankCode" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (Keep these from Prisma)
CREATE INDEX "UserBankAccount_userId_idx" ON "UserBankAccount"("userId");
CREATE UNIQUE INDEX "UserBankAccount_userId_accountNumber_key" ON "UserBankAccount"("userId", "accountNumber");
CREATE INDEX "LeagueEntry_userId_idx" ON "LeagueEntry"("userId");
CREATE INDEX "LeagueEntry_leagueId_idx" ON "LeagueEntry"("leagueId");
CREATE INDEX "LeagueEntry_leagueId_finalPoints_idx" ON "LeagueEntry"("leagueId", "finalPoints");
CREATE INDEX "LeagueEntry_leagueId_rank_idx" ON "LeagueEntry"("leagueId", "rank");
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- AddForeignKey (Keep this from Prisma)
ALTER TABLE "UserBankAccount" ADD CONSTRAINT "UserBankAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;