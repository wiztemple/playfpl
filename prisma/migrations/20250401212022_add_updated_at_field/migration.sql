/*
  Warnings:

  - Added the required column `updatedAt` to the `LeagueEntry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LeagueEntry" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
