-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "billing_address_line" TEXT,
ADD COLUMN     "billing_district" TEXT,
ADD COLUMN     "billing_postal_code" TEXT,
ADD COLUMN     "billing_province" TEXT,
ADD COLUMN     "billing_subdistrict" TEXT,
ADD COLUMN     "shipping_address_line" TEXT,
ADD COLUMN     "shipping_district" TEXT,
ADD COLUMN     "shipping_postal_code" TEXT,
ADD COLUMN     "shipping_province" TEXT,
ADD COLUMN     "shipping_subdistrict" TEXT;
