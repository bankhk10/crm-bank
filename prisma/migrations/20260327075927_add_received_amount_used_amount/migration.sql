/*
  Warnings:

  - You are about to drop the column `amount` on the `PromotionalBudgetDetail` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PromotionalBudgetDetail" DROP COLUMN "amount",
ADD COLUMN     "receivedAmount" DECIMAL(15,2),
ADD COLUMN     "usedAmount" DECIMAL(15,2);
