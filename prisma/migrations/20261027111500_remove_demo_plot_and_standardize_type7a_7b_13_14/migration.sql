-- DropForeignKey
ALTER TABLE "activity_attachments" DROP CONSTRAINT IF EXISTS "activity_attachments_demo_plot_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_attachments" DROP CONSTRAINT IF EXISTS "activity_attachments_demo_plot_visit_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_type_10_targets" DROP CONSTRAINT IF EXISTS "activity_type_10_targets_demo_plot_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_type_13_results" DROP CONSTRAINT IF EXISTS "activity_type_13_results_demo_plot_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_type_13_targets" DROP CONSTRAINT IF EXISTS "activity_type_13_targets_demo_plot_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_type_14_results" DROP CONSTRAINT IF EXISTS "activity_type_14_results_demo_plot_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_type_14_targets" DROP CONSTRAINT IF EXISTS "activity_type_14_targets_demo_plot_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_type_7a_results" DROP CONSTRAINT IF EXISTS "activity_type_7a_results_demo_plot_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_type_7a_targets" DROP CONSTRAINT IF EXISTS "activity_type_7a_targets_demo_plot_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_type_7b_results" DROP CONSTRAINT IF EXISTS "activity_type_7b_results_demo_plot_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_type_7b_targets" DROP CONSTRAINT IF EXISTS "activity_type_7b_targets_demo_plot_id_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "demo_plot_external_products" DROP CONSTRAINT IF EXISTS "demo_plot_external_products_demo_plot_id_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "demo_plot_irrigations" DROP CONSTRAINT IF EXISTS "demo_plot_irrigations_demo_plot_id_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "demo_plot_products" DROP CONSTRAINT IF EXISTS "demo_plot_products_demo_plot_id_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "demo_plot_products" DROP CONSTRAINT IF EXISTS "demo_plot_products_product_id_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "demo_plot_visits" DROP CONSTRAINT IF EXISTS "demo_plot_visits_activity_plan_id_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "demo_plot_visits" DROP CONSTRAINT IF EXISTS "demo_plot_visits_demo_plot_id_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "demo_plots" DROP CONSTRAINT IF EXISTS "demo_plots_activity_plan_id_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "demo_plots" DROP CONSTRAINT IF EXISTS "demo_plots_customer_id_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "demo_plots" DROP CONSTRAINT IF EXISTS "demo_plots_farmer_customer_id_fkey";

-- DropIndex
DROP INDEX IF EXISTS "activity_attachments_demo_plot_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "activity_attachments_demo_plot_visit_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "activity_type_10_targets_demo_plot_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "activity_type_13_results_demo_plot_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "activity_type_13_targets_demo_plot_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "activity_type_14_results_demo_plot_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "activity_type_14_targets_demo_plot_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "activity_type_7a_results_demo_plot_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "activity_type_7a_targets_demo_plot_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "activity_type_7b_results_demo_plot_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "activity_type_7b_targets_demo_plot_id_idx";

-- AlterTable
ALTER TABLE "activity_attachments" DROP COLUMN IF EXISTS "demo_plot_id",
DROP COLUMN IF EXISTS "demo_plot_visit_id";

-- AlterTable
ALTER TABLE "activity_type_10_targets" DROP COLUMN IF EXISTS "demo_plot_id",
ADD COLUMN IF NOT EXISTS "type_7a_target_id" TEXT;

-- AlterTable
ALTER TABLE "activity_type_13_results" DROP COLUMN IF EXISTS "demo_plot_id";

-- AlterTable
ALTER TABLE "activity_type_13_targets" DROP COLUMN IF EXISTS "demo_plot_id",
ADD COLUMN IF NOT EXISTS "code" TEXT,
ADD COLUMN IF NOT EXISTS "status" "DemoPlotStatus" NOT NULL DEFAULT 'IN_PROGRESS';

-- AlterTable
ALTER TABLE "activity_type_14_results" DROP COLUMN IF EXISTS "demo_plot_id",
ADD COLUMN IF NOT EXISTS "type_13_target_id" TEXT;

-- AlterTable
ALTER TABLE "activity_type_14_targets" DROP COLUMN IF EXISTS "demo_plot_id",
ADD COLUMN IF NOT EXISTS "type_13_target_id" TEXT;

-- AlterTable
ALTER TABLE "activity_type_7a_actual_products" ADD COLUMN IF NOT EXISTS "extra_unit" TEXT;

-- AlterTable
ALTER TABLE "activity_type_7a_results" DROP COLUMN IF EXISTS "demo_plot_id",
ADD COLUMN IF NOT EXISTS "experiment_detail" TEXT;

-- AlterTable
ALTER TABLE "activity_type_7a_targets" DROP COLUMN IF EXISTS "demo_plot_id",
ADD COLUMN IF NOT EXISTS "category_id" TEXT,
ADD COLUMN IF NOT EXISTS "closed_date" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "code" TEXT,
ADD COLUMN IF NOT EXISTS "status" "DemoPlotStatus" NOT NULL DEFAULT 'IN_PROGRESS';

-- AlterTable
ALTER TABLE "activity_type_7b_results" DROP COLUMN IF EXISTS "demo_plot_id",
ADD COLUMN IF NOT EXISTS "type_7a_target_id" TEXT,
ADD COLUMN IF NOT EXISTS "yield_increase_percent" DECIMAL(6,2);

-- AlterTable
ALTER TABLE "activity_type_7b_targets" DROP COLUMN IF EXISTS "demo_plot_id",
ADD COLUMN IF NOT EXISTS "type_7a_target_id" TEXT;

-- DropTable
DROP TABLE IF EXISTS "demo_plot_external_products";

-- DropTable
DROP TABLE IF EXISTS "demo_plot_irrigations";

-- DropTable
DROP TABLE IF EXISTS "demo_plot_products";

-- DropTable
DROP TABLE IF EXISTS "demo_plot_visits";

-- DropTable
DROP TABLE IF EXISTS "demo_plots";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "activity_type_10_targets_type_7a_target_id_idx" ON "activity_type_10_targets"("type_7a_target_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "activity_type_13_targets_code_key" ON "activity_type_13_targets"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "activity_type_13_targets_status_idx" ON "activity_type_13_targets"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "activity_type_14_results_type_13_target_id_idx" ON "activity_type_14_results"("type_13_target_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "activity_type_14_targets_type_13_target_id_idx" ON "activity_type_14_targets"("type_13_target_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "activity_type_7a_targets_code_key" ON "activity_type_7a_targets"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "activity_type_7a_targets_status_idx" ON "activity_type_7a_targets"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "activity_type_7b_results_type_7a_target_id_idx" ON "activity_type_7b_results"("type_7a_target_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "activity_type_7b_targets_type_7a_target_id_idx" ON "activity_type_7b_targets"("type_7a_target_id");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_type_7b_targets_type_7a_target_id_fkey') THEN
    ALTER TABLE "activity_type_7b_targets" ADD CONSTRAINT "activity_type_7b_targets_type_7a_target_id_fkey" FOREIGN KEY ("type_7a_target_id") REFERENCES "activity_type_7a_targets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_type_7b_results_type_7a_target_id_fkey') THEN
    ALTER TABLE "activity_type_7b_results" ADD CONSTRAINT "activity_type_7b_results_type_7a_target_id_fkey" FOREIGN KEY ("type_7a_target_id") REFERENCES "activity_type_7a_targets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_type_14_targets_type_13_target_id_fkey') THEN
    ALTER TABLE "activity_type_14_targets" ADD CONSTRAINT "activity_type_14_targets_type_13_target_id_fkey" FOREIGN KEY ("type_13_target_id") REFERENCES "activity_type_13_targets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_type_14_results_type_13_target_id_fkey') THEN
    ALTER TABLE "activity_type_14_results" ADD CONSTRAINT "activity_type_14_results_type_13_target_id_fkey" FOREIGN KEY ("type_13_target_id") REFERENCES "activity_type_13_targets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_type_10_targets_type_7a_target_id_fkey') THEN
    ALTER TABLE "activity_type_10_targets" ADD CONSTRAINT "activity_type_10_targets_type_7a_target_id_fkey" FOREIGN KEY ("type_7a_target_id") REFERENCES "activity_type_7a_targets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
