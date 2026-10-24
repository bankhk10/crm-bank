-- Drop legacy / previous tables if they exist
DROP TABLE IF EXISTS "activity_plan_type_5_targets" CASCADE;
DROP TABLE IF EXISTS "activity_type_5_result" CASCADE;
DROP TABLE IF EXISTS "activity_type_5_targets" CASCADE;

DROP TABLE IF EXISTS "activity_plan_type_6_targets" CASCADE;
DROP TABLE IF EXISTS "activity_type_6_result" CASCADE;
DROP TABLE IF EXISTS "activity_type_6_targets" CASCADE;

-- CreateTable: activity_type_5_targets
CREATE TABLE "activity_type_5_targets" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "store_id" TEXT,
    "product_id" TEXT,
    "detail" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_5_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable: activity_type_5_result
CREATE TABLE "activity_type_5_result" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "target_id" TEXT,
    "store_id" TEXT,
    "product_id" TEXT,
    "competitor_brand" TEXT,
    "competitor_product" TEXT,
    "pos_price" DECIMAL(15,2),
    "dealer_price" DECIMAL(15,2),
    "subdealer_price" DECIMAL(15,2),
    "farmer_price" DECIMAL(15,2),
    "competitor_price" DECIMAL(15,2),
    "competitor_unit" TEXT,
    "selling_points" TEXT,
    "promotion_detail" TEXT,
    "is_additional" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_5_result_pkey" PRIMARY KEY ("id")
);

-- CreateTable: activity_type_6_targets
CREATE TABLE "activity_type_6_targets" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "store_id" TEXT,
    "customer_name" TEXT,
    "is_manual_customer" BOOLEAN NOT NULL DEFAULT false,
    "issue_type" TEXT NOT NULL DEFAULT 'สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย',
    "detail" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_6_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable: activity_type_6_result
CREATE TABLE "activity_type_6_result" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "target_id" TEXT,
    "product_id" TEXT,
    "product_name" TEXT,
    "lot_number" TEXT,
    "purchase_channel" TEXT NOT NULL DEFAULT 'ร้านค้าตัวแทนจำหน่าย',
    "store_id" TEXT,
    "store_name" TEXT,
    "customer_name" TEXT,
    "is_manual_customer" BOOLEAN NOT NULL DEFAULT false,
    "issue_type" TEXT NOT NULL DEFAULT 'สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย',
    "detail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'เสร็จสิ้น',
    "problem_found" TEXT,
    "initial_solution" TEXT,
    "next_action" TEXT,
    "is_additional" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_6_result_pkey" PRIMARY KEY ("id")
);

-- AlterTable: activity_attachments (Add type_5_result_id, type_6_result_id)
ALTER TABLE "activity_attachments" ADD COLUMN IF NOT EXISTS "type_5_result_id" TEXT;
ALTER TABLE "activity_attachments" ADD COLUMN IF NOT EXISTS "type_6_result_id" TEXT;

-- CreateIndex: activity_type_5_targets
CREATE INDEX "activity_type_5_targets_activity_plan_id_idx" ON "activity_type_5_targets"("activity_plan_id");
CREATE INDEX "activity_type_5_targets_store_id_idx" ON "activity_type_5_targets"("store_id");
CREATE INDEX "activity_type_5_targets_product_id_idx" ON "activity_type_5_targets"("product_id");

-- CreateIndex: activity_type_5_result
CREATE INDEX "activity_type_5_result_activity_plan_id_idx" ON "activity_type_5_result"("activity_plan_id");
CREATE INDEX "activity_type_5_result_target_id_idx" ON "activity_type_5_result"("target_id");
CREATE INDEX "activity_type_5_result_store_id_idx" ON "activity_type_5_result"("store_id");
CREATE INDEX "activity_type_5_result_product_id_idx" ON "activity_type_5_result"("product_id");

-- CreateIndex: activity_type_6_targets
CREATE INDEX "activity_type_6_targets_activity_plan_id_idx" ON "activity_type_6_targets"("activity_plan_id");
CREATE INDEX "activity_type_6_targets_store_id_idx" ON "activity_type_6_targets"("store_id");

-- CreateIndex: activity_type_6_result
CREATE INDEX "activity_type_6_result_activity_plan_id_idx" ON "activity_type_6_result"("activity_plan_id");
CREATE INDEX "activity_type_6_result_target_id_idx" ON "activity_type_6_result"("target_id");
CREATE INDEX "activity_type_6_result_store_id_idx" ON "activity_type_6_result"("store_id");
CREATE INDEX "activity_type_6_result_product_id_idx" ON "activity_type_6_result"("product_id");

-- CreateIndex: activity_attachments
CREATE INDEX IF NOT EXISTS "activity_attachments_type_5_result_id_idx" ON "activity_attachments"("type_5_result_id");
CREATE INDEX IF NOT EXISTS "activity_attachments_type_6_result_id_idx" ON "activity_attachments"("type_6_result_id");

-- AddForeignKey: activity_type_5_targets
ALTER TABLE "activity_type_5_targets" ADD CONSTRAINT "activity_type_5_targets_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_5_targets" ADD CONSTRAINT "activity_type_5_targets_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "activity_type_5_targets" ADD CONSTRAINT "activity_type_5_targets_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: activity_type_5_result
ALTER TABLE "activity_type_5_result" ADD CONSTRAINT "activity_type_5_result_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_5_result" ADD CONSTRAINT "activity_type_5_result_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "activity_type_5_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_5_result" ADD CONSTRAINT "activity_type_5_result_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "activity_type_5_result" ADD CONSTRAINT "activity_type_5_result_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: activity_type_6_targets
ALTER TABLE "activity_type_6_targets" ADD CONSTRAINT "activity_type_6_targets_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_6_targets" ADD CONSTRAINT "activity_type_6_targets_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: activity_type_6_result
ALTER TABLE "activity_type_6_result" ADD CONSTRAINT "activity_type_6_result_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_6_result" ADD CONSTRAINT "activity_type_6_result_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "activity_type_6_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_6_result" ADD CONSTRAINT "activity_type_6_result_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "activity_type_6_result" ADD CONSTRAINT "activity_type_6_result_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: activity_attachments
ALTER TABLE "activity_attachments" ADD CONSTRAINT "activity_attachments_type_5_result_id_fkey" FOREIGN KEY ("type_5_result_id") REFERENCES "activity_type_5_result"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_attachments" ADD CONSTRAINT "activity_attachments_type_6_result_id_fkey" FOREIGN KEY ("type_6_result_id") REFERENCES "activity_type_6_result"("id") ON DELETE CASCADE ON UPDATE CASCADE;

