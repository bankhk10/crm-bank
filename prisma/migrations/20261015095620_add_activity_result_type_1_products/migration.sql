-- CreateTable
CREATE TABLE "activity_result_type_1_products" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "target_id" TEXT,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_result_type_1_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_result_type_1_products_activity_plan_id_idx" ON "activity_result_type_1_products"("activity_plan_id");

-- CreateIndex
CREATE INDEX "activity_result_type_1_products_product_id_idx" ON "activity_result_type_1_products"("product_id");

-- CreateIndex
CREATE INDEX "activity_result_type_1_products_target_id_idx" ON "activity_result_type_1_products"("target_id");

-- AddForeignKey
ALTER TABLE "activity_result_type_1_products" ADD CONSTRAINT "activity_result_type_1_products_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_result_type_1_products" ADD CONSTRAINT "activity_result_type_1_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
