/*
  Warnings:

  - You are about to drop the `activity_plan_items` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "activity_plan_items" DROP CONSTRAINT "activity_plan_items_activity_plan_id_fkey";

-- AlterTable
ALTER TABLE "activity_plan_products" ADD COLUMN     "is_price_overridden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "master_price" DECIMAL(15,2);

-- AlterTable
ALTER TABLE "activity_plan_stores" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "sub_dealer_store" TEXT,
ADD COLUMN     "target_amount" DECIMAL(15,2);

-- AlterTable
ALTER TABLE "activity_plans" ADD COLUMN     "target_attendees_count" INTEGER,
ADD COLUMN     "target_booking_sales" DECIMAL(15,2);

-- DropTable
DROP TABLE "activity_plan_items";

-- CreateTable
CREATE TABLE "activity_plan_marketing_items" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "material_name" TEXT NOT NULL,
    "unit" TEXT,
    "unit_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_plan_marketing_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_plan_promotion_items" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "budget_type" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_plan_promotion_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_plan_marketing_items_activity_plan_id_idx" ON "activity_plan_marketing_items"("activity_plan_id");

-- CreateIndex
CREATE INDEX "activity_plan_marketing_items_category_idx" ON "activity_plan_marketing_items"("category");

-- CreateIndex
CREATE INDEX "activity_plan_promotion_items_activity_plan_id_idx" ON "activity_plan_promotion_items"("activity_plan_id");

-- CreateIndex
CREATE INDEX "activity_plan_promotion_items_budget_type_idx" ON "activity_plan_promotion_items"("budget_type");

-- AddForeignKey
ALTER TABLE "activity_plan_marketing_items" ADD CONSTRAINT "activity_plan_marketing_items_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_plan_promotion_items" ADD CONSTRAINT "activity_plan_promotion_items_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
