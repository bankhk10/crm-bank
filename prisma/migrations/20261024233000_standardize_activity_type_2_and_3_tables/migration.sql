-- Drop legacy tables if they exist
DROP TABLE IF EXISTS "activity_plan_type_2_products" CASCADE;
DROP TABLE IF EXISTS "activity_plan_type_2_targets" CASCADE;
DROP TABLE IF EXISTS "activity_type_2_products" CASCADE;
DROP TABLE IF EXISTS "activity_type_2_result" CASCADE;
DROP TABLE IF EXISTS "activity_type_2_targets" CASCADE;

DROP TABLE IF EXISTS "activity_plan_type_3_products" CASCADE;
DROP TABLE IF EXISTS "activity_plan_type_3_targets" CASCADE;
DROP TABLE IF EXISTS "activity_type_3_products" CASCADE;
DROP TABLE IF EXISTS "activity_type_3_result" CASCADE;
DROP TABLE IF EXISTS "activity_type_3_targets" CASCADE;

-- CreateTable: activity_type_2_targets
CREATE TABLE "activity_type_2_targets" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "visit_purpose" TEXT NOT NULL,
    "store_id" TEXT,
    "province" TEXT NOT NULL,
    "is_unregistered_farmer" BOOLEAN NOT NULL DEFAULT false,
    "unregistered_farmer_name" TEXT,
    "unregistered_farmer_phone" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_2_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable: activity_type_2_products
CREATE TABLE "activity_type_2_products" (
    "id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_2_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable: activity_type_2_result
CREATE TABLE "activity_type_2_result" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "target_id" TEXT,
    "store_id" TEXT,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT,
    "usage_result" TEXT,
    "followup_detail" TEXT,
    "problem_detail" TEXT,
    "is_additional" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_2_result_pkey" PRIMARY KEY ("id")
);

-- CreateTable: activity_type_3_targets
CREATE TABLE "activity_type_3_targets" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "store_id" TEXT,
    "is_sub_dealer" BOOLEAN NOT NULL DEFAULT false,
    "sub_dealer_store" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_3_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable: activity_type_3_products
CREATE TABLE "activity_type_3_products" (
    "id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "target_quantity" INTEGER,
    "unit_price" DECIMAL(15,2),
    "target_amount" DECIMAL(15,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_3_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable: activity_type_3_result
CREATE TABLE "activity_type_3_result" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "target_id" TEXT,
    "store_id" TEXT,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT,
    "actual_quantity" INTEGER NOT NULL DEFAULT 0,
    "actual_unit_price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "actual_total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "unclosed_reason" TEXT,
    "is_additional" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_3_result_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes: activity_type_2_targets
CREATE INDEX "activity_type_2_targets_activity_plan_id_idx" ON "activity_type_2_targets"("activity_plan_id");
CREATE INDEX "activity_type_2_targets_store_id_idx" ON "activity_type_2_targets"("store_id");

-- CreateIndexes: activity_type_2_products
CREATE INDEX "activity_type_2_products_target_id_idx" ON "activity_type_2_products"("target_id");
CREATE INDEX "activity_type_2_products_activity_plan_id_idx" ON "activity_type_2_products"("activity_plan_id");
CREATE INDEX "activity_type_2_products_product_id_idx" ON "activity_type_2_products"("product_id");

-- CreateIndexes: activity_type_2_result
CREATE INDEX "activity_type_2_result_activity_plan_id_idx" ON "activity_type_2_result"("activity_plan_id");
CREATE INDEX "activity_type_2_result_target_id_idx" ON "activity_type_2_result"("target_id");
CREATE INDEX "activity_type_2_result_store_id_idx" ON "activity_type_2_result"("store_id");
CREATE INDEX "activity_type_2_result_product_id_idx" ON "activity_type_2_result"("product_id");
CREATE INDEX "activity_type_2_result_is_additional_idx" ON "activity_type_2_result"("is_additional");

-- CreateIndexes: activity_type_3_targets
CREATE INDEX "activity_type_3_targets_activity_plan_id_idx" ON "activity_type_3_targets"("activity_plan_id");
CREATE INDEX "activity_type_3_targets_store_id_idx" ON "activity_type_3_targets"("store_id");

-- CreateIndexes: activity_type_3_products
CREATE INDEX "activity_type_3_products_target_id_idx" ON "activity_type_3_products"("target_id");
CREATE INDEX "activity_type_3_products_activity_plan_id_idx" ON "activity_type_3_products"("activity_plan_id");
CREATE INDEX "activity_type_3_products_product_id_idx" ON "activity_type_3_products"("product_id");

-- CreateIndexes: activity_type_3_result
CREATE INDEX "activity_type_3_result_activity_plan_id_idx" ON "activity_type_3_result"("activity_plan_id");
CREATE INDEX "activity_type_3_result_target_id_idx" ON "activity_type_3_result"("target_id");
CREATE INDEX "activity_type_3_result_store_id_idx" ON "activity_type_3_result"("store_id");
CREATE INDEX "activity_type_3_result_product_id_idx" ON "activity_type_3_result"("product_id");
CREATE INDEX "activity_type_3_result_is_additional_idx" ON "activity_type_3_result"("is_additional");

-- AddForeignKey: activity_type_2_targets
ALTER TABLE "activity_type_2_targets" ADD CONSTRAINT "activity_type_2_targets_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_2_targets" ADD CONSTRAINT "activity_type_2_targets_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: activity_type_2_products
ALTER TABLE "activity_type_2_products" ADD CONSTRAINT "activity_type_2_products_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "activity_type_2_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_2_products" ADD CONSTRAINT "activity_type_2_products_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_2_products" ADD CONSTRAINT "activity_type_2_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: activity_type_2_result
ALTER TABLE "activity_type_2_result" ADD CONSTRAINT "activity_type_2_result_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_2_result" ADD CONSTRAINT "activity_type_2_result_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "activity_type_2_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_2_result" ADD CONSTRAINT "activity_type_2_result_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "activity_type_2_result" ADD CONSTRAINT "activity_type_2_result_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: activity_type_3_targets
ALTER TABLE "activity_type_3_targets" ADD CONSTRAINT "activity_type_3_targets_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_3_targets" ADD CONSTRAINT "activity_type_3_targets_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: activity_type_3_products
ALTER TABLE "activity_type_3_products" ADD CONSTRAINT "activity_type_3_products_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "activity_type_3_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_3_products" ADD CONSTRAINT "activity_type_3_products_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_3_products" ADD CONSTRAINT "activity_type_3_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: activity_type_3_result
ALTER TABLE "activity_type_3_result" ADD CONSTRAINT "activity_type_3_result_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_3_result" ADD CONSTRAINT "activity_type_3_result_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "activity_type_3_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_3_result" ADD CONSTRAINT "activity_type_3_result_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "activity_type_3_result" ADD CONSTRAINT "activity_type_3_result_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

