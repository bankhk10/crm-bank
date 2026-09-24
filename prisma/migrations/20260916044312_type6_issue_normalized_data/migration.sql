-- AlterTable
ALTER TABLE "activity_attachments" ADD COLUMN     "issue_item_id" TEXT;

-- CreateTable
CREATE TABLE "activity_result_issue_items" (
    "id" TEXT NOT NULL,
    "activity_result_id" TEXT NOT NULL,
    "product_id" TEXT,
    "product_name" TEXT,
    "lot_number" TEXT,
    "purchase_channel" TEXT NOT NULL,
    "store_id" TEXT,
    "store_name" TEXT,
    "issue_type" TEXT NOT NULL,
    "detail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'เสร็จสิ้น',

    CONSTRAINT "activity_result_issue_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_result_issue_items_activity_result_id_idx" ON "activity_result_issue_items"("activity_result_id");

-- CreateIndex
CREATE INDEX "activity_result_issue_items_product_id_idx" ON "activity_result_issue_items"("product_id");

-- CreateIndex
CREATE INDEX "activity_result_issue_items_store_id_idx" ON "activity_result_issue_items"("store_id");

-- CreateIndex
CREATE INDEX "activity_result_issue_items_purchase_channel_idx" ON "activity_result_issue_items"("purchase_channel");

-- CreateIndex
CREATE INDEX "activity_attachments_issue_item_id_idx" ON "activity_attachments"("issue_item_id");

-- AddForeignKey
ALTER TABLE "activity_result_issue_items" ADD CONSTRAINT "activity_result_issue_items_activity_result_id_fkey" FOREIGN KEY ("activity_result_id") REFERENCES "activity_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_result_issue_items" ADD CONSTRAINT "activity_result_issue_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_result_issue_items" ADD CONSTRAINT "activity_result_issue_items_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_attachments" ADD CONSTRAINT "activity_attachments_issue_item_id_fkey" FOREIGN KEY ("issue_item_id") REFERENCES "activity_result_issue_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
