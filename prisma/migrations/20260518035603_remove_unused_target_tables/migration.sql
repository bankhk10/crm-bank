/*
  Warnings:

  - You are about to drop the `ProductGroupSalesTarget` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductSalesTarget` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RegionSalesTarget` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProductSalesTarget" DROP CONSTRAINT "ProductSalesTarget_productId_fkey";

-- DropTable
DROP TABLE "ProductGroupSalesTarget";

-- DropTable
DROP TABLE "ProductSalesTarget";

-- DropTable
DROP TABLE "RegionSalesTarget";
