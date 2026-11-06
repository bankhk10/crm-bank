-- CreateEnum
CREATE TYPE "TourType" AS ENUM ('CENTRAL', 'STORE');

-- CreateEnum
CREATE TYPE "TourSize" AS ENUM ('SMALL', 'LARGE');

-- CreateEnum
CREATE TYPE "AttachmentCategory" AS ENUM ('PRICE_TAG', 'SHELF', 'CROP', 'PLOT', 'ATMOSPHERE', 'ISSUE', 'GENERAL');

-- DropForeignKey
ALTER TABLE "activity_plans" DROP CONSTRAINT "activity_plans_activity_type_id_fkey";

-- DropForeignKey
ALTER TABLE "activity_results" DROP CONSTRAINT "activity_results_recorded_by_id_fkey";

-- AlterTable
ALTER TABLE "activity_plan_items" ADD COLUMN     "work_type_code" TEXT;

-- AlterTable
ALTER TABLE "activity_plans" ALTER COLUMN "activity_type_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "activity_results" ADD COLUMN     "discussion_result" TEXT,
ADD COLUMN     "next_meeting_date" TIMESTAMP(3),
ADD COLUMN     "product_advice" TEXT,
ADD COLUMN     "sales_opportunity" TEXT,
ALTER COLUMN "recorded_by_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "activity_types" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "has_actual" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "requires_approval" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "activity_plan_work_types" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "activity_type_id" TEXT NOT NULL,

    CONSTRAINT "activity_plan_work_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_plan_stores" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "work_type_code" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "store_name" TEXT,
    "remarks" TEXT,

    CONSTRAINT "activity_plan_stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_plan_products" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "work_type_code" TEXT NOT NULL,
    "store_id" TEXT,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT,
    "target_quantity" INTEGER,
    "unit_price" DECIMAL(15,2),
    "target_amount" DECIMAL(15,2),

    CONSTRAINT "activity_plan_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_plan_tours" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "tour_type" "TourType" NOT NULL,
    "tour_size" "TourSize",
    "country" TEXT,
    "store_id" TEXT,
    "destination" TEXT,

    CONSTRAINT "activity_plan_tours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_result_sale_items" (
    "id" TEXT NOT NULL,
    "activity_result_id" TEXT NOT NULL,
    "work_type_code" TEXT NOT NULL,
    "store_id" TEXT,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT,
    "actual_quantity" INTEGER NOT NULL,
    "actual_unit_price" DECIMAL(15,2) NOT NULL,
    "actual_total" DECIMAL(15,2) NOT NULL,
    "unclosed_reason" TEXT,

    CONSTRAINT "activity_result_sale_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_result_stock_items" (
    "id" TEXT NOT NULL,
    "activity_result_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "remaining_quantity" INTEGER NOT NULL DEFAULT 0,
    "stock_status" TEXT,
    "reorder_opportunity" TEXT,
    "remarks" TEXT,

    CONSTRAINT "activity_result_stock_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_result_survey_items" (
    "id" TEXT NOT NULL,
    "activity_result_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "product_id" TEXT,
    "competitor_brand" TEXT NOT NULL,
    "competitor_product" TEXT NOT NULL,
    "competitor_price" DECIMAL(15,2),
    "competitor_unit" TEXT,
    "promotion_detail" TEXT,

    CONSTRAINT "activity_result_survey_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_result_demo_items" (
    "id" TEXT NOT NULL,
    "activity_result_id" TEXT NOT NULL,
    "demo_plot_id" TEXT,
    "crop_age_value" TEXT,
    "crop_age_unit" TEXT,
    "growth_stage" TEXT,
    "crop_condition" TEXT,
    "product_response" TEXT,
    "problem_description" TEXT,
    "final_yield_kg" DECIMAL(10,2),
    "control_yield_kg" DECIMAL(10,2),
    "satisfaction_score" INTEGER,

    CONSTRAINT "activity_result_demo_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_attachments" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "activity_result_id" TEXT,
    "work_type_code" TEXT,
    "store_id" TEXT,
    "product_id" TEXT,
    "category" "AttachmentCategory" NOT NULL DEFAULT 'GENERAL',
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_plan_work_types_activity_plan_id_idx" ON "activity_plan_work_types"("activity_plan_id");

-- CreateIndex
CREATE INDEX "activity_plan_work_types_activity_type_id_idx" ON "activity_plan_work_types"("activity_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "activity_plan_work_types_activity_plan_id_activity_type_id_key" ON "activity_plan_work_types"("activity_plan_id", "activity_type_id");

-- CreateIndex
CREATE INDEX "activity_plan_stores_activity_plan_id_idx" ON "activity_plan_stores"("activity_plan_id");

-- CreateIndex
CREATE INDEX "activity_plan_stores_store_id_idx" ON "activity_plan_stores"("store_id");

-- CreateIndex
CREATE INDEX "activity_plan_stores_work_type_code_idx" ON "activity_plan_stores"("work_type_code");

-- CreateIndex
CREATE INDEX "activity_plan_products_activity_plan_id_idx" ON "activity_plan_products"("activity_plan_id");

-- CreateIndex
CREATE INDEX "activity_plan_products_product_id_idx" ON "activity_plan_products"("product_id");

-- CreateIndex
CREATE INDEX "activity_plan_products_store_id_idx" ON "activity_plan_products"("store_id");

-- CreateIndex
CREATE INDEX "activity_plan_products_work_type_code_idx" ON "activity_plan_products"("work_type_code");

-- CreateIndex
CREATE UNIQUE INDEX "activity_plan_tours_activity_plan_id_key" ON "activity_plan_tours"("activity_plan_id");

-- CreateIndex
CREATE INDEX "activity_plan_tours_tour_type_idx" ON "activity_plan_tours"("tour_type");

-- CreateIndex
CREATE INDEX "activity_plan_tours_country_idx" ON "activity_plan_tours"("country");

-- CreateIndex
CREATE INDEX "activity_plan_tours_store_id_idx" ON "activity_plan_tours"("store_id");

-- CreateIndex
CREATE INDEX "activity_result_sale_items_activity_result_id_idx" ON "activity_result_sale_items"("activity_result_id");

-- CreateIndex
CREATE INDEX "activity_result_sale_items_product_id_idx" ON "activity_result_sale_items"("product_id");

-- CreateIndex
CREATE INDEX "activity_result_sale_items_store_id_idx" ON "activity_result_sale_items"("store_id");

-- CreateIndex
CREATE INDEX "activity_result_sale_items_work_type_code_idx" ON "activity_result_sale_items"("work_type_code");

-- CreateIndex
CREATE INDEX "activity_result_stock_items_activity_result_id_idx" ON "activity_result_stock_items"("activity_result_id");

-- CreateIndex
CREATE INDEX "activity_result_stock_items_store_id_idx" ON "activity_result_stock_items"("store_id");

-- CreateIndex
CREATE INDEX "activity_result_stock_items_product_id_idx" ON "activity_result_stock_items"("product_id");

-- CreateIndex
CREATE INDEX "activity_result_survey_items_activity_result_id_idx" ON "activity_result_survey_items"("activity_result_id");

-- CreateIndex
CREATE INDEX "activity_result_survey_items_store_id_idx" ON "activity_result_survey_items"("store_id");

-- CreateIndex
CREATE INDEX "activity_result_survey_items_competitor_brand_idx" ON "activity_result_survey_items"("competitor_brand");

-- CreateIndex
CREATE INDEX "activity_result_demo_items_activity_result_id_idx" ON "activity_result_demo_items"("activity_result_id");

-- CreateIndex
CREATE INDEX "activity_result_demo_items_demo_plot_id_idx" ON "activity_result_demo_items"("demo_plot_id");

-- CreateIndex
CREATE INDEX "activity_attachments_activity_plan_id_idx" ON "activity_attachments"("activity_plan_id");

-- CreateIndex
CREATE INDEX "activity_attachments_activity_result_id_idx" ON "activity_attachments"("activity_result_id");

-- CreateIndex
CREATE INDEX "activity_attachments_category_idx" ON "activity_attachments"("category");

-- CreateIndex
CREATE INDEX "activity_attachments_store_id_idx" ON "activity_attachments"("store_id");

-- CreateIndex
CREATE INDEX "activity_attachments_product_id_idx" ON "activity_attachments"("product_id");

-- AddForeignKey
ALTER TABLE "activity_plans" ADD CONSTRAINT "activity_plans_activity_type_id_fkey" FOREIGN KEY ("activity_type_id") REFERENCES "activity_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_plan_work_types" ADD CONSTRAINT "activity_plan_work_types_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_plan_work_types" ADD CONSTRAINT "activity_plan_work_types_activity_type_id_fkey" FOREIGN KEY ("activity_type_id") REFERENCES "activity_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_plan_stores" ADD CONSTRAINT "activity_plan_stores_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_plan_stores" ADD CONSTRAINT "activity_plan_stores_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_plan_products" ADD CONSTRAINT "activity_plan_products_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_plan_products" ADD CONSTRAINT "activity_plan_products_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_plan_products" ADD CONSTRAINT "activity_plan_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_plan_tours" ADD CONSTRAINT "activity_plan_tours_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_plan_tours" ADD CONSTRAINT "activity_plan_tours_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_results" ADD CONSTRAINT "activity_results_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_result_sale_items" ADD CONSTRAINT "activity_result_sale_items_activity_result_id_fkey" FOREIGN KEY ("activity_result_id") REFERENCES "activity_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_result_sale_items" ADD CONSTRAINT "activity_result_sale_items_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_result_sale_items" ADD CONSTRAINT "activity_result_sale_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_result_stock_items" ADD CONSTRAINT "activity_result_stock_items_activity_result_id_fkey" FOREIGN KEY ("activity_result_id") REFERENCES "activity_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_result_stock_items" ADD CONSTRAINT "activity_result_stock_items_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_result_stock_items" ADD CONSTRAINT "activity_result_stock_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_result_survey_items" ADD CONSTRAINT "activity_result_survey_items_activity_result_id_fkey" FOREIGN KEY ("activity_result_id") REFERENCES "activity_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_result_survey_items" ADD CONSTRAINT "activity_result_survey_items_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_result_survey_items" ADD CONSTRAINT "activity_result_survey_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_result_demo_items" ADD CONSTRAINT "activity_result_demo_items_activity_result_id_fkey" FOREIGN KEY ("activity_result_id") REFERENCES "activity_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_attachments" ADD CONSTRAINT "activity_attachments_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_attachments" ADD CONSTRAINT "activity_attachments_activity_result_id_fkey" FOREIGN KEY ("activity_result_id") REFERENCES "activity_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_attachments" ADD CONSTRAINT "activity_attachments_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_attachments" ADD CONSTRAINT "activity_attachments_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
