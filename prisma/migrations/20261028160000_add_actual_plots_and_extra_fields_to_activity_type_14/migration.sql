-- AlterTable
ALTER TABLE "activity_type_14_results" ADD COLUMN IF NOT EXISTS "actual_plots_count" INTEGER;

-- AlterTable
ALTER TABLE "activity_type_14_products_used" ADD COLUMN IF NOT EXISTS "extra_quantity" DECIMAL(10,2);
ALTER TABLE "activity_type_14_products_used" ADD COLUMN IF NOT EXISTS "extra_unit" TEXT;

