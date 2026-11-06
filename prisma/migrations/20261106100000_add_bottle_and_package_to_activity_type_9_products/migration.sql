-- AlterTable
ALTER TABLE "activity_type_9_products"
ADD COLUMN IF NOT EXISTS "package_size_per_box" DECIMAL(15,3),
ADD COLUMN IF NOT EXISTS "actual_bottle_quantity" DECIMAL(10,2) DEFAULT 0;

