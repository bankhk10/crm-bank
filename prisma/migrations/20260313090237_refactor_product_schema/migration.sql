/*
  Warnings:

  - You are about to drop the column `chemicalGroup` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `productGroup` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "chemicalGroup",
DROP COLUMN "productGroup",
ADD COLUMN     "productGroupId" TEXT,
ADD COLUMN     "tradeNameGroupId" TEXT;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_tradeNameGroupId_fkey" FOREIGN KEY ("tradeNameGroupId") REFERENCES "TradeNameGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_productGroupId_fkey" FOREIGN KEY ("productGroupId") REFERENCES "ProductGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
