/*
  Warnings:

  - You are about to drop the column `customerId` on the `SalesTarget` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `SalesTargetItem` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `SalesTargetItem` table. All the data in the column will be lost.
  - You are about to drop the column `salesTargetId` on the `SalesTargetItem` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[year,month,employeeId]` on the table `SalesTarget` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `salesTargetStoreId` to the `SalesTargetItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "SalesTarget" DROP CONSTRAINT "SalesTarget_customerId_fkey";

-- DropForeignKey
ALTER TABLE "SalesTargetItem" DROP CONSTRAINT "SalesTargetItem_salesTargetId_fkey";

-- DropIndex
DROP INDEX "SalesTarget_customerId_idx";

-- DropIndex
DROP INDEX "SalesTargetItem_salesTargetId_idx";

-- AlterTable
ALTER TABLE "SalesTarget" DROP COLUMN "customerId";

-- AlterTable
ALTER TABLE "SalesTargetItem" DROP COLUMN "amount",
DROP COLUMN "quantity",
DROP COLUMN "salesTargetId",
ADD COLUMN     "pricePerBox" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "qtyPerBox" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "salesTargetStoreId" TEXT NOT NULL,
ADD COLUMN     "targetAmount" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "SalesTargetStore" (
    "id" TEXT NOT NULL,
    "salesTargetId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,

    CONSTRAINT "SalesTargetStore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalesTargetStore_salesTargetId_idx" ON "SalesTargetStore"("salesTargetId");

-- CreateIndex
CREATE INDEX "SalesTargetStore_customerId_idx" ON "SalesTargetStore"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesTargetStore_salesTargetId_customerId_key" ON "SalesTargetStore"("salesTargetId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesTarget_year_month_employeeId_key" ON "SalesTarget"("year", "month", "employeeId");

-- CreateIndex
CREATE INDEX "SalesTargetItem_salesTargetStoreId_idx" ON "SalesTargetItem"("salesTargetStoreId");

-- AddForeignKey
ALTER TABLE "SalesTargetStore" ADD CONSTRAINT "SalesTargetStore_salesTargetId_fkey" FOREIGN KEY ("salesTargetId") REFERENCES "SalesTarget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTargetStore" ADD CONSTRAINT "SalesTargetStore_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesTargetItem" ADD CONSTRAINT "SalesTargetItem_salesTargetStoreId_fkey" FOREIGN KEY ("salesTargetStoreId") REFERENCES "SalesTargetStore"("id") ON DELETE CASCADE ON UPDATE CASCADE;
