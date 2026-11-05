-- Drop legacy tables if they exist
DROP TABLE IF EXISTS "activity_result_type_1_products" CASCADE;
DROP TABLE IF EXISTS "activity_result_type_1" CASCADE;
DROP TABLE IF EXISTS "activity_plan_type_1_stores" CASCADE;
DROP TABLE IF EXISTS "activity_type_1_products" CASCADE;
DROP TABLE IF EXISTS "activity_type_1_result" CASCADE;
DROP TABLE IF EXISTS "activity_type_1_targets" CASCADE;

DROP TABLE IF EXISTS "activity_result_type_4" CASCADE;
DROP TABLE IF EXISTS "activity_plan_type_4_targets" CASCADE;
DROP TABLE IF EXISTS "activity_type_4_result" CASCADE;
DROP TABLE IF EXISTS "activity_type_4_targets" CASCADE;

-- CreateTable: activity_type_1_targets
CREATE TABLE "activity_type_1_targets" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "visit_purpose" TEXT NOT NULL,
    "store_id" TEXT,
    "province" TEXT NOT NULL,
    "is_unregistered_farmer" BOOLEAN NOT NULL DEFAULT false,
    "unregistered_farmer_name" TEXT,
    "unregistered_farmer_phone" TEXT,
    "topic" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_1_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable: activity_type_1_products
CREATE TABLE "activity_type_1_products" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_1_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable: activity_type_1_result
CREATE TABLE "activity_type_1_result" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "target_id" TEXT,
    "product_advice" TEXT,
    "discussion_result" TEXT,
    "sales_opportunity" TEXT,
    "next_action" TEXT,
    "next_meeting_date" TIMESTAMP(3),
    "farmer_home_address" TEXT,
    "plot_latitude" DECIMAL(10,7),
    "plot_longitude" DECIMAL(10,7),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_1_result_pkey" PRIMARY KEY ("id")
);

-- CreateTable: activity_type_4_targets
CREATE TABLE "activity_type_4_targets" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "collect_type" TEXT NOT NULL DEFAULT 'COLLECT',
    "store_id" TEXT,
    "target_amount" DECIMAL(15,2),
    "invoice_no" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_4_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable: activity_type_4_result
CREATE TABLE "activity_type_4_result" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "target_id" TEXT,
    "store_id" TEXT,
    "company_name" TEXT,
    "collect_type" TEXT NOT NULL DEFAULT 'COLLECT',
    "target_amount" DECIMAL(15,2),
    "received_amount" DECIMAL(15,2),
    "order_no" TEXT,
    "billing_status" TEXT,
    "billing_detail" TEXT,
    "collect_detail" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_4_result_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE INDEX "activity_type_1_targets_activity_plan_id_idx" ON "activity_type_1_targets"("activity_plan_id");
CREATE INDEX "activity_type_1_targets_store_id_idx" ON "activity_type_1_targets"("store_id");

CREATE INDEX "activity_type_1_products_activity_plan_id_idx" ON "activity_type_1_products"("activity_plan_id");
CREATE INDEX "activity_type_1_products_target_id_idx" ON "activity_type_1_products"("target_id");
CREATE INDEX "activity_type_1_products_product_id_idx" ON "activity_type_1_products"("product_id");

CREATE UNIQUE INDEX "activity_type_1_result_target_id_key" ON "activity_type_1_result"("target_id");
CREATE INDEX "activity_type_1_result_activity_plan_id_idx" ON "activity_type_1_result"("activity_plan_id");
CREATE INDEX "activity_type_1_result_target_id_idx" ON "activity_type_1_result"("target_id");

CREATE INDEX "activity_type_4_targets_activity_plan_id_idx" ON "activity_type_4_targets"("activity_plan_id");
CREATE INDEX "activity_type_4_targets_store_id_idx" ON "activity_type_4_targets"("store_id");

CREATE UNIQUE INDEX "activity_type_4_result_target_id_key" ON "activity_type_4_result"("target_id");
CREATE INDEX "activity_type_4_result_activity_plan_id_idx" ON "activity_type_4_result"("activity_plan_id");
CREATE INDEX "activity_type_4_result_target_id_idx" ON "activity_type_4_result"("target_id");
CREATE INDEX "activity_type_4_result_store_id_idx" ON "activity_type_4_result"("store_id");

-- AddForeignKeys
ALTER TABLE "activity_type_1_targets" ADD CONSTRAINT "activity_type_1_targets_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_1_targets" ADD CONSTRAINT "activity_type_1_targets_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "activity_type_1_products" ADD CONSTRAINT "activity_type_1_products_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_1_products" ADD CONSTRAINT "activity_type_1_products_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "activity_type_1_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_1_products" ADD CONSTRAINT "activity_type_1_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "activity_type_1_result" ADD CONSTRAINT "activity_type_1_result_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_1_result" ADD CONSTRAINT "activity_type_1_result_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "activity_type_1_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "activity_type_4_targets" ADD CONSTRAINT "activity_type_4_targets_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_4_targets" ADD CONSTRAINT "activity_type_4_targets_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "activity_type_4_result" ADD CONSTRAINT "activity_type_4_result_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_4_result" ADD CONSTRAINT "activity_type_4_result_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "activity_type_4_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_4_result" ADD CONSTRAINT "activity_type_4_result_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

