/*
  Warnings:

  - You are about to drop the column `productGroup` on the `DailySalesSummary` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DailySalesSummary" DROP COLUMN "productGroup",
ADD COLUMN     "productGroupId" TEXT,
ADD COLUMN     "tradeNameGroupId" TEXT;
