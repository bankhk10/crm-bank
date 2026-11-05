-- CreateTable
CREATE TABLE "activity_type_8_targets" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "meeting_target" TEXT NOT NULL DEFAULT 'FARMER',
    "farmer_channel" TEXT,
    "dealer_id" TEXT,
    "dealer_name" TEXT,
    "subdealer_id" TEXT,
    "sub_dealer_store" TEXT,
    "is_unregistered_subdealer" BOOLEAN NOT NULL DEFAULT false,
    "topic" TEXT NOT NULL,
    "venue_type" TEXT NOT NULL DEFAULT 'STORE',
    "location" TEXT,
    "meeting_date" TIMESTAMP(3),
    "meeting_time" TEXT,
    "target_attendees_count" INTEGER NOT NULL DEFAULT 0,
    "detail" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_8_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_type_8_products" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "product_id" TEXT,
    "product_name" TEXT,
    "product_role" TEXT NOT NULL DEFAULT 'TARGET',
    "target_quantity" DECIMAL(10,2),
    "target_unit_price" DECIMAL(15,2),
    "target_amount" DECIMAL(15,2),
    "promotion_notes" TEXT,
    "actual_quantity" DECIMAL(10,2),
    "actual_unit_price" DECIMAL(15,2),
    "actual_total" DECIMAL(15,2),
    "actual_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_8_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_type_8_result" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "actual_attendees_count" INTEGER NOT NULL DEFAULT 0,
    "feedback_qna" TEXT,
    "summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_8_result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_type_8_targets_activity_plan_id_idx" ON "activity_type_8_targets"("activity_plan_id");

-- CreateIndex
CREATE INDEX "activity_type_8_targets_dealer_id_idx" ON "activity_type_8_targets"("dealer_id");

-- CreateIndex
CREATE INDEX "activity_type_8_targets_subdealer_id_idx" ON "activity_type_8_targets"("subdealer_id");

-- CreateIndex
CREATE INDEX "activity_type_8_products_activity_plan_id_idx" ON "activity_type_8_products"("activity_plan_id");

-- CreateIndex
CREATE INDEX "activity_type_8_products_target_id_idx" ON "activity_type_8_products"("target_id");

-- CreateIndex
CREATE INDEX "activity_type_8_products_product_id_idx" ON "activity_type_8_products"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "activity_type_8_result_target_id_key" ON "activity_type_8_result"("target_id");

-- CreateIndex
CREATE INDEX "activity_type_8_result_activity_plan_id_idx" ON "activity_type_8_result"("activity_plan_id");

-- CreateIndex
CREATE INDEX "activity_type_8_result_target_id_idx" ON "activity_type_8_result"("target_id");

-- AddForeignKey
ALTER TABLE "activity_type_8_targets" ADD CONSTRAINT "activity_type_8_targets_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_type_8_targets" ADD CONSTRAINT "activity_type_8_targets_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_type_8_targets" ADD CONSTRAINT "activity_type_8_targets_subdealer_id_fkey" FOREIGN KEY ("subdealer_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_type_8_products" ADD CONSTRAINT "activity_type_8_products_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_type_8_products" ADD CONSTRAINT "activity_type_8_products_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "activity_type_8_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_type_8_products" ADD CONSTRAINT "activity_type_8_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_type_8_result" ADD CONSTRAINT "activity_type_8_result_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_type_8_result" ADD CONSTRAINT "activity_type_8_result_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "activity_type_8_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

