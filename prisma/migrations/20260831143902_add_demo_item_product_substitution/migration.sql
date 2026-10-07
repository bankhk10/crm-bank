-- AlterTable
ALTER TABLE "activity_result_demo_items" ADD COLUMN     "actual_product_id" TEXT,
ADD COLUMN     "change_reason" TEXT,
ADD COLUMN     "planned_product_id" TEXT;

-- CreateIndex
CREATE INDEX "activity_result_demo_items_planned_product_id_idx" ON "activity_result_demo_items"("planned_product_id");

-- CreateIndex
CREATE INDEX "activity_result_demo_items_actual_product_id_idx" ON "activity_result_demo_items"("actual_product_id");

-- AddForeignKey
ALTER TABLE "activity_result_demo_items" ADD CONSTRAINT "activity_result_demo_items_planned_product_id_fkey" FOREIGN KEY ("planned_product_id") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_result_demo_items" ADD CONSTRAINT "activity_result_demo_items_actual_product_id_fkey" FOREIGN KEY ("actual_product_id") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
