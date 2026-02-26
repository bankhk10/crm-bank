/*
  Warnings:

  - You are about to drop the column `billingAddressSnapshot` on the `SaleAddress` table. All the data in the column will be lost.
  - You are about to drop the column `companyAddressSnapshot` on the `SaleAddress` table. All the data in the column will be lost.
  - You are about to drop the column `pickupAddressSnapshot` on the `SaleAddress` table. All the data in the column will be lost.
  - You are about to drop the column `shippingAddressSnapshot` on the `SaleAddress` table. All the data in the column will be lost.
  - You are about to drop the column `shippingCompanyAddressSnapshot` on the `SaleAddress` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SaleAddress" DROP COLUMN "billingAddressSnapshot",
DROP COLUMN "companyAddressSnapshot",
DROP COLUMN "pickupAddressSnapshot",
DROP COLUMN "shippingAddressSnapshot",
DROP COLUMN "shippingCompanyAddressSnapshot",
ADD COLUMN     "address_code" TEXT,
ADD COLUMN     "address_district" TEXT,
ADD COLUMN     "address_line" TEXT,
ADD COLUMN     "address_province" TEXT,
ADD COLUMN     "address_subdistrict" TEXT,
ADD COLUMN     "billing_address_line" TEXT,
ADD COLUMN     "billing_district" TEXT,
ADD COLUMN     "billing_note" TEXT,
ADD COLUMN     "billing_postal_code" TEXT,
ADD COLUMN     "billing_province" TEXT,
ADD COLUMN     "billing_subdistrict" TEXT,
ADD COLUMN     "company_name" TEXT,
ADD COLUMN     "company_note" TEXT,
ADD COLUMN     "company_phone" TEXT,
ADD COLUMN     "receiving_address_line" TEXT,
ADD COLUMN     "receiving_district" TEXT,
ADD COLUMN     "receiving_name" TEXT,
ADD COLUMN     "receiving_note" TEXT,
ADD COLUMN     "receiving_phone" TEXT,
ADD COLUMN     "receiving_postal_code" TEXT,
ADD COLUMN     "receiving_province" TEXT,
ADD COLUMN     "receiving_subdistrict" TEXT,
ADD COLUMN     "sender_district" TEXT,
ADD COLUMN     "sender_line" TEXT,
ADD COLUMN     "sender_name" TEXT,
ADD COLUMN     "sender_note" TEXT,
ADD COLUMN     "sender_phone" TEXT,
ADD COLUMN     "sender_postal_code" TEXT,
ADD COLUMN     "sender_province" TEXT,
ADD COLUMN     "sender_subdistrict" TEXT,
ADD COLUMN     "shipping_address_line" TEXT,
ADD COLUMN     "shipping_district" TEXT,
ADD COLUMN     "shipping_note" TEXT,
ADD COLUMN     "shipping_postal_code" TEXT,
ADD COLUMN     "shipping_province" TEXT,
ADD COLUMN     "shipping_subdistrict" TEXT;
