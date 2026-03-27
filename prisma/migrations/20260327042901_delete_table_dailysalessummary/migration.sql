/*
  Warnings:

  - You are about to drop the `DailySalesSummary` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DailySalesSummary" DROP CONSTRAINT "DailySalesSummary_customerId_fkey";

-- DropForeignKey
ALTER TABLE "DailySalesSummary" DROP CONSTRAINT "DailySalesSummary_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "DailySalesSummary" DROP CONSTRAINT "DailySalesSummary_productId_fkey";

-- DropTable
DROP TABLE "DailySalesSummary";
