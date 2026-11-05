-- AlterTable
ALTER TABLE "activity_result_sale_items" ADD COLUMN     "is_additional" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "activity_result_sale_items_is_additional_idx" ON "activity_result_sale_items"("is_additional");
