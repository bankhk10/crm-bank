-- CreateTable
CREATE TABLE "activity_type_11_targets" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "store_id" TEXT,
    "store_name" TEXT,
    "is_unregistered_store" BOOLEAN NOT NULL DEFAULT false,
    "store_code" TEXT,
    "province" TEXT,
    "district" TEXT,
    "dealer_id" TEXT,
    "dealer_name" TEXT,
    "visit_purpose" TEXT DEFAULT 'ตรวจเช็คสต๊อกหน้าร้าน',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_11_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_type_11_products" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "product_id" TEXT,
    "product_name" TEXT,
    "product_role" TEXT NOT NULL DEFAULT 'TARGET',
    "target_quantity" DECIMAL(10,2),
    "target_notes" TEXT,
    "actual_quantity" DECIMAL(10,2),
    "stock_status" TEXT,
    "reorder_opportunity" TEXT,
    "suggested_order_qty" DECIMAL(10,2),
    "remarks" TEXT,
    "next_action" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_11_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_type_11_result" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "overall_stock_status" TEXT,
    "overall_reorder_opportunity" TEXT,
    "feedback" TEXT,
    "next_action" TEXT,
    "summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_11_result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_type_11_targets_activity_plan_id_idx" ON "activity_type_11_targets"("activity_plan_id");

-- CreateIndex
CREATE INDEX "activity_type_11_targets_store_id_idx" ON "activity_type_11_targets"("store_id");

-- CreateIndex
CREATE INDEX "activity_type_11_targets_dealer_id_idx" ON "activity_type_11_targets"("dealer_id");

-- CreateIndex
CREATE INDEX "activity_type_11_products_activity_plan_id_idx" ON "activity_type_11_products"("activity_plan_id");

-- CreateIndex
CREATE INDEX "activity_type_11_products_target_id_idx" ON "activity_type_11_products"("target_id");

-- CreateIndex
CREATE INDEX "activity_type_11_products_product_id_idx" ON "activity_type_11_products"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "activity_type_11_result_target_id_key" ON "activity_type_11_result"("target_id");

-- CreateIndex
CREATE INDEX "activity_type_11_result_activity_plan_id_idx" ON "activity_type_11_result"("activity_plan_id");

-- CreateIndex
CREATE INDEX "activity_type_11_result_target_id_idx" ON "activity_type_11_result"("target_id");

-- AddForeignKey
ALTER TABLE "activity_type_11_targets" ADD CONSTRAINT "activity_type_11_targets_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_type_11_targets" ADD CONSTRAINT "activity_type_11_targets_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_type_11_targets" ADD CONSTRAINT "activity_type_11_targets_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_type_11_products" ADD CONSTRAINT "activity_type_11_products_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_type_11_products" ADD CONSTRAINT "activity_type_11_products_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "activity_type_11_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_type_11_products" ADD CONSTRAINT "activity_type_11_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_type_11_result" ADD CONSTRAINT "activity_type_11_result_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_type_11_result" ADD CONSTRAINT "activity_type_11_result_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "activity_type_11_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

