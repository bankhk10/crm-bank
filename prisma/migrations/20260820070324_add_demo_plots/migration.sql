-- CreateEnum
CREATE TYPE "DemoPlotStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityResultStatus" ADD VALUE 'POSTPONED';
ALTER TYPE "ActivityResultStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "activity_results" ADD COLUMN     "cancel_reason" TEXT,
ADD COLUMN     "postponed_date" TIMESTAMP(3),
ADD COLUMN     "postponed_notes" TEXT,
ADD COLUMN     "postponed_reason" TEXT,
ADD COLUMN     "postponed_time" TEXT,
ALTER COLUMN "result_status" SET DEFAULT 'PARTIAL';

-- CreateTable
CREATE TABLE "demo_plots" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "owner_name" TEXT NOT NULL,
    "customer_id" TEXT,
    "employee_id" TEXT NOT NULL,
    "crop_category" TEXT NOT NULL,
    "crop_name" TEXT NOT NULL,
    "custom_crop_name" TEXT,
    "area_rai" DECIMAL(10,2),
    "tree_count" INTEGER,
    "location" TEXT,
    "province" TEXT,
    "district" TEXT,
    "primary_product_id" TEXT,
    "primary_product_name" TEXT NOT NULL,
    "objective" TEXT,
    "experiment_detail" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "planting_date" TIMESTAMP(3),
    "planting_area_condition" TEXT,
    "usage_method" TEXT,
    "closed_date" TIMESTAMP(3),
    "status" "DemoPlotStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "final_harvest_date" TIMESTAMP(3),
    "control_yield_kg" DECIMAL(12,2),
    "demo_yield_kg" DECIMAL(12,2),
    "yield_increase_percent" DECIMAL(6,2),
    "farmer_satisfaction" INTEGER,
    "commercial_potential" TEXT,
    "final_summary_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "demo_plots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demo_plot_visits" (
    "id" TEXT NOT NULL,
    "demo_plot_id" TEXT NOT NULL,
    "activity_plan_id" TEXT,
    "visit_number" INTEGER NOT NULL DEFAULT 1,
    "visit_date" TIMESTAMP(3) NOT NULL,
    "days_since_start" INTEGER NOT NULL DEFAULT 0,
    "crop_age_value" INTEGER,
    "crop_age_unit" TEXT,
    "growth_stage" TEXT,
    "crop_condition" TEXT,
    "crop_problem_desc" TEXT,
    "product_response" TEXT,
    "product_problem_desc" TEXT,
    "usage_method" TEXT,
    "product_used_qty" INTEGER DEFAULT 0,
    "product_unit_price" DECIMAL(12,2),
    "product_cost" DECIMAL(12,2),
    "other_expenses" DECIMAL(12,2) DEFAULT 0,
    "total_visit_cost" DECIMAL(12,2),
    "crop_image_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "plot_image_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "image_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demo_plot_visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "demo_plots_code_key" ON "demo_plots"("code");

-- CreateIndex
CREATE INDEX "demo_plots_employee_id_idx" ON "demo_plots"("employee_id");

-- CreateIndex
CREATE INDEX "demo_plots_status_idx" ON "demo_plots"("status");

-- CreateIndex
CREATE INDEX "demo_plots_crop_category_idx" ON "demo_plots"("crop_category");

-- CreateIndex
CREATE INDEX "demo_plots_owner_name_idx" ON "demo_plots"("owner_name");

-- CreateIndex
CREATE INDEX "demo_plot_visits_demo_plot_id_idx" ON "demo_plot_visits"("demo_plot_id");

-- CreateIndex
CREATE INDEX "demo_plot_visits_activity_plan_id_idx" ON "demo_plot_visits"("activity_plan_id");

-- CreateIndex
CREATE INDEX "demo_plot_visits_visit_date_idx" ON "demo_plot_visits"("visit_date");

-- AddForeignKey
ALTER TABLE "demo_plot_visits" ADD CONSTRAINT "demo_plot_visits_demo_plot_id_fkey" FOREIGN KEY ("demo_plot_id") REFERENCES "demo_plots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demo_plot_visits" ADD CONSTRAINT "demo_plot_visits_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
