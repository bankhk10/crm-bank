/*
  Warnings:

  - You are about to drop the column `productChain` on the `SaleItem` table. All the data in the column will be lost.
  - You are about to drop the column `productGroup` on the `SaleItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SaleItem" DROP COLUMN "productChain",
DROP COLUMN "productGroup",
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "categoryName" TEXT,
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "productABCTypeName" TEXT,
ADD COLUMN     "productGroupId" TEXT,
ADD COLUMN     "productGroupName" TEXT,
ADD COLUMN     "properties" TEXT,
ADD COLUMN     "salesPoint" TEXT,
ADD COLUMN     "status" "ProductStatus",
ADD COLUMN     "tradeNameGroupName" TEXT,
ADD COLUMN     "usedForPlants" TEXT[];
