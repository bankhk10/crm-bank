-- AlterTable
ALTER TABLE "activity_result_spray_products" ADD COLUMN     "detail" TEXT,
ADD COLUMN     "drug_withdrawal_item_id" TEXT;

-- CreateIndex
CREATE INDEX "activity_result_spray_products_drug_withdrawal_item_id_idx" ON "activity_result_spray_products"("drug_withdrawal_item_id");

-- AddForeignKey
ALTER TABLE "activity_result_spray_products" ADD CONSTRAINT "activity_result_spray_products_drug_withdrawal_item_id_fkey" FOREIGN KEY ("drug_withdrawal_item_id") REFERENCES "drug_withdrawal_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
