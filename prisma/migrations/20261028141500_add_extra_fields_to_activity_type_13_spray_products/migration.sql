-- AlterTable
ALTER TABLE "activity_type_13_spray_products" ADD COLUMN IF NOT EXISTS "extra_quantity" DECIMAL(10,2);
ALTER TABLE "activity_type_13_spray_products" ADD COLUMN IF NOT EXISTS "extra_unit" TEXT;

