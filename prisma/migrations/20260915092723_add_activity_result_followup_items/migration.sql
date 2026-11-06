-- CreateTable
CREATE TABLE "activity_result_followup_items" (
    "id" TEXT NOT NULL,
    "activity_result_id" TEXT NOT NULL,
    "store_id" TEXT,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT,
    "usage_result" TEXT,
    "followup_detail" TEXT,
    "problem_detail" TEXT,
    "is_additional" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "activity_result_followup_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_result_followup_items_activity_result_id_idx" ON "activity_result_followup_items"("activity_result_id");

-- CreateIndex
CREATE INDEX "activity_result_followup_items_product_id_idx" ON "activity_result_followup_items"("product_id");

-- CreateIndex
CREATE INDEX "activity_result_followup_items_store_id_idx" ON "activity_result_followup_items"("store_id");

-- CreateIndex
CREATE INDEX "activity_result_followup_items_is_additional_idx" ON "activity_result_followup_items"("is_additional");

-- AddForeignKey
ALTER TABLE "activity_result_followup_items" ADD CONSTRAINT "activity_result_followup_items_activity_result_id_fkey" FOREIGN KEY ("activity_result_id") REFERENCES "activity_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_result_followup_items" ADD CONSTRAINT "activity_result_followup_items_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_result_followup_items" ADD CONSTRAINT "activity_result_followup_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
