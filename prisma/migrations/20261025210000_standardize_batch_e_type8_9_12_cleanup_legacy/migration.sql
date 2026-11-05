-- DropForeignKey
ALTER TABLE "activity_attachments" DROP CONSTRAINT IF EXISTS "activity_attachments_issue_item_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_attachments" DROP CONSTRAINT IF EXISTS "activity_attachments_spray_round_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_attachments" DROP CONSTRAINT IF EXISTS "activity_attachments_survey_item_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_plan_products" DROP CONSTRAINT IF EXISTS "activity_plan_products_activity_plan_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_plan_products" DROP CONSTRAINT IF EXISTS "activity_plan_products_product_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_plan_products" DROP CONSTRAINT IF EXISTS "activity_plan_products_store_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_plan_stores" DROP CONSTRAINT IF EXISTS "activity_plan_stores_activity_plan_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_plan_stores" DROP CONSTRAINT IF EXISTS "activity_plan_stores_store_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_plan_tours" DROP CONSTRAINT IF EXISTS "activity_plan_tours_activity_plan_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_plan_tours" DROP CONSTRAINT IF EXISTS "activity_plan_tours_store_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_result_demo_items" DROP CONSTRAINT IF EXISTS "activity_result_demo_items_activity_result_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_result_demo_items" DROP CONSTRAINT IF EXISTS "activity_result_demo_items_actual_product_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_result_demo_items" DROP CONSTRAINT IF EXISTS "activity_result_demo_items_planned_product_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_result_followup_items" DROP CONSTRAINT IF EXISTS "activity_result_followup_items_activity_result_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_result_followup_items" DROP CONSTRAINT IF EXISTS "activity_result_followup_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_result_followup_items" DROP CONSTRAINT IF EXISTS "activity_result_followup_items_store_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_result_issue_items" DROP CONSTRAINT IF EXISTS "activity_result_issue_items_activity_result_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_result_issue_items" DROP CONSTRAINT IF EXISTS "activity_result_issue_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_result_issue_items" DROP CONSTRAINT IF EXISTS "activity_result_issue_items_store_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_result_sale_items" DROP CONSTRAINT IF EXISTS "activity_result_sale_items_activity_result_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_result_sale_items" DROP CONSTRAINT IF EXISTS "activity_result_sale_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_result_sale_items" DROP CONSTRAINT IF EXISTS "activity_result_sale_items_store_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_result_spray_externals" DROP CONSTRAINT IF EXISTS "activity_result_spray_externals_spray_round_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_result_spray_products" DROP CONSTRAINT IF EXISTS "activity_result_spray_products_product_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_result_spray_products" DROP CONSTRAINT IF EXISTS "activity_result_spray_products_spray_round_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_result_spray_rounds" DROP CONSTRAINT IF EXISTS "activity_result_spray_rounds_activity_result_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_result_spray_rounds" DROP CONSTRAINT IF EXISTS "activity_result_spray_rounds_demo_plot_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_result_stock_items" DROP CONSTRAINT IF EXISTS "activity_result_stock_items_activity_result_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_result_stock_items" DROP CONSTRAINT IF EXISTS "activity_result_stock_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_result_stock_items" DROP CONSTRAINT IF EXISTS "activity_result_stock_items_store_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_result_survey_items" DROP CONSTRAINT IF EXISTS "activity_result_survey_items_activity_result_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_result_survey_items" DROP CONSTRAINT IF EXISTS "activity_result_survey_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_result_survey_items" DROP CONSTRAINT IF EXISTS "activity_result_survey_items_store_id_fkey";

-- DropIndex
DROP INDEX IF EXISTS "activity_attachments_issue_item_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "activity_attachments_spray_round_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "activity_attachments_survey_item_id_idx";

-- AlterTable
ALTER TABLE "activity_attachments" DROP COLUMN IF EXISTS "issue_item_id",
DROP COLUMN IF EXISTS "spray_round_id",
DROP COLUMN IF EXISTS "survey_item_id",
ADD COLUMN IF NOT EXISTS "type_12_result_id" TEXT;

-- DropTable
DROP TABLE IF EXISTS "activity_plan_products";

-- DropTable
DROP TABLE IF EXISTS "activity_plan_stores";

-- DropTable
DROP TABLE IF EXISTS "activity_plan_tours";

-- DropTable
DROP TABLE IF EXISTS "activity_result_demo_items";

-- DropTable
DROP TABLE IF EXISTS "activity_result_followup_items";

-- DropTable
DROP TABLE IF EXISTS "activity_result_issue_items";

-- DropTable
DROP TABLE IF EXISTS "activity_result_sale_items";

-- DropTable
DROP TABLE IF EXISTS "activity_result_spray_externals";

-- DropTable
DROP TABLE IF EXISTS "activity_result_spray_products";

-- DropTable
DROP TABLE IF EXISTS "activity_result_spray_rounds";

-- DropTable
DROP TABLE IF EXISTS "activity_result_stock_items";

-- DropTable
DROP TABLE IF EXISTS "activity_result_survey_items";

-- CreateTable
CREATE TABLE IF NOT EXISTS "activity_type_12_targets" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "tour_type" "TourType" NOT NULL DEFAULT 'CENTRAL',
    "tour_size" "TourSize",
    "country" TEXT,
    "store_id" TEXT,
    "destination" TEXT,
    "target_attendees_count" INTEGER NOT NULL DEFAULT 0,
    "detail" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_12_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "activity_type_12_result" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "actual_attendees_count" INTEGER NOT NULL DEFAULT 0,
    "tour_highlights" TEXT,
    "feedback_issues" TEXT,
    "summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_12_result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "activity_type_12_targets_activity_plan_id_idx" ON "activity_type_12_targets"("activity_plan_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "activity_type_12_targets_tour_type_idx" ON "activity_type_12_targets"("tour_type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "activity_type_12_targets_store_id_idx" ON "activity_type_12_targets"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "activity_type_12_result_target_id_key" ON "activity_type_12_result"("target_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "activity_type_12_result_activity_plan_id_idx" ON "activity_type_12_result"("activity_plan_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "activity_type_12_result_target_id_idx" ON "activity_type_12_result"("target_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "activity_attachments_type_12_result_id_idx" ON "activity_attachments"("type_12_result_id");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'activity_attachments_type_12_result_id_fkey'
  ) THEN
    ALTER TABLE "activity_attachments" ADD CONSTRAINT "activity_attachments_type_12_result_id_fkey" FOREIGN KEY ("type_12_result_id") REFERENCES "activity_type_12_result"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'activity_type_12_targets_activity_plan_id_fkey'
  ) THEN
    ALTER TABLE "activity_type_12_targets" ADD CONSTRAINT "activity_type_12_targets_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'activity_type_12_targets_store_id_fkey'
  ) THEN
    ALTER TABLE "activity_type_12_targets" ADD CONSTRAINT "activity_type_12_targets_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'activity_type_12_result_activity_plan_id_fkey'
  ) THEN
    ALTER TABLE "activity_type_12_result" ADD CONSTRAINT "activity_type_12_result_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'activity_type_12_result_target_id_fkey'
  ) THEN
    ALTER TABLE "activity_type_12_result" ADD CONSTRAINT "activity_type_12_result_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "activity_type_12_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

