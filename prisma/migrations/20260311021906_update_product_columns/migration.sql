/*
  Warnings:

  - The `packageSize` column on the `Product` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `packageSizePerBox` column on the `Product` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `totalPackageSizePerBox` column on the `Product` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `packageSize` column on the `SaleItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `packageSizePerBox` column on the `SaleItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `totalPackageSizePerBox` column on the `SaleItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "packageSizeUnit" TEXT,
DROP COLUMN "packageSize",
ADD COLUMN     "packageSize" DECIMAL(15,3),
DROP COLUMN "packageSizePerBox",
ADD COLUMN     "packageSizePerBox" DECIMAL(15,3),
DROP COLUMN "totalPackageSizePerBox",
ADD COLUMN     "totalPackageSizePerBox" DECIMAL(15,3);

-- AlterTable
ALTER TABLE "SaleItem" ADD COLUMN     "packageSizeUnit" TEXT,
DROP COLUMN "packageSize",
ADD COLUMN     "packageSize" DECIMAL(15,3),
DROP COLUMN "packageSizePerBox",
ADD COLUMN     "packageSizePerBox" DECIMAL(15,3),
DROP COLUMN "totalPackageSizePerBox",
ADD COLUMN     "totalPackageSizePerBox" DECIMAL(15,3);
