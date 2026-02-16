-- AlterTable: Add shippingCompanyId to Sale
ALTER TABLE "Sale" ADD COLUMN "shippingCompanyId" TEXT;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_shippingCompanyId_fkey" FOREIGN KEY ("shippingCompanyId") REFERENCES "ShippingCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: Add address fields to ShippingCompany
ALTER TABLE "ShippingCompany" ADD COLUMN IF NOT EXISTS "addressLine" TEXT;
ALTER TABLE "ShippingCompany" ADD COLUMN IF NOT EXISTS "district" TEXT;
ALTER TABLE "ShippingCompany" ADD COLUMN IF NOT EXISTS "postalCode" TEXT;
ALTER TABLE "ShippingCompany" ADD COLUMN IF NOT EXISTS "province" TEXT;
ALTER TABLE "ShippingCompany" ADD COLUMN IF NOT EXISTS "subdistrict" TEXT;
