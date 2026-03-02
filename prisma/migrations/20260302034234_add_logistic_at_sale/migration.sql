/*
  Warnings:

  - You are about to drop the column `billingAddress` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `pickupCompanyId` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `shippingAddress` on the `Sale` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_pickupCompanyId_fkey";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "parentId" TEXT;

-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "billingAddress",
DROP COLUMN "pickupCompanyId",
DROP COLUMN "shippingAddress";

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
