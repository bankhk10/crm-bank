/*
  Warnings:

  - The `companyAddressSnapshot` column on the `SaleAddress` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `billingAddressSnapshot` column on the `SaleAddress` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `shippingAddressSnapshot` column on the `SaleAddress` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `pickupAddressSnapshot` column on the `SaleAddress` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `shippingCompanyAddressSnapshot` column on the `SaleAddress` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "SaleAddress" DROP COLUMN "companyAddressSnapshot",
ADD COLUMN     "companyAddressSnapshot" JSONB,
DROP COLUMN "billingAddressSnapshot",
ADD COLUMN     "billingAddressSnapshot" JSONB,
DROP COLUMN "shippingAddressSnapshot",
ADD COLUMN     "shippingAddressSnapshot" JSONB,
DROP COLUMN "pickupAddressSnapshot",
ADD COLUMN     "pickupAddressSnapshot" JSONB,
DROP COLUMN "shippingCompanyAddressSnapshot",
ADD COLUMN     "shippingCompanyAddressSnapshot" JSONB;
