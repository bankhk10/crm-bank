-- CreateTable
CREATE TABLE "activity_type_10_targets" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "demo_plot_id" TEXT,
    "plot_name" TEXT,
    "farmer_name" TEXT,
    "crop_category" TEXT,
    "crop_name" TEXT,
    "location" TEXT,
    "province" TEXT,
    "district" TEXT,
    "subdistrict" TEXT,
    "latitude" TEXT,
    "longitude" TEXT,
    "showcase_product_id" TEXT,
    "showcase_product_name" TEXT,
    "target_attendees_count" INTEGER DEFAULT 0,
    "target_booking_sales" DECIMAL(15,2),
    "event_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_10_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_type_10_products" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "product_id" TEXT,
    "product_name" TEXT,
    "product_role" TEXT NOT NULL DEFAULT 'TARGET',
    "target_quantity" DECIMAL(10,2),
    "target_unit_price" DECIMAL(15,2),
    "target_amount" DECIMAL(15,2),
    "actual_quantity" DECIMAL(10,2),
    "actual_unit_price" DECIMAL(15,2),
    "actual_total" DECIMAL(15,2),
    "actual_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_10_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_type_10_result" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "actual_attendees_count" INTEGER NOT NULL DEFAULT 0,
    "actual_total_sales" DECIMAL(15,2),
    "farmer_feedback" TEXT,
    "target_farmers_list" TEXT,
    "summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_10_result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_type_10_targets_activity_plan_id_idx" ON "activity_type_10_targets"("activity_plan_id");

-- CreateIndex
CREATE INDEX "activity_type_10_targets_demo_plot_id_idx" ON "activity_type_10_targets"("demo_plot_id");

-- CreateIndex
CREATE INDEX "activity_type_10_targets_showcase_product_id_idx" ON "activity_type_10_targets"("showcase_product_id");

-- CreateIndex
CREATE INDEX "activity_type_10_products_activity_plan_id_idx" ON "activity_type_10_products"("activity_plan_id");

-- CreateIndex
CREATE INDEX "activity_type_10_products_target_id_idx" ON "activity_type_10_products"("target_id");

-- CreateIndex
CREATE INDEX "activity_type_10_products_product_id_idx" ON "activity_type_10_products"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "activity_type_10_result_target_id_key" ON "activity_type_10_result"("target_id");

-- CreateIndex
CREATE INDEX "activity_type_10_result_activity_plan_id_idx" ON "activity_type_10_result"("activity_plan_id");

-- CreateIndex
CREATE INDEX "activity_type_10_result_target_id_idx" ON "activity_type_10_result"("target_id");

-- AddForeignKey
ALTER TABLE "activity_type_10_targets" ADD CONSTRAINT "activity_type_10_targets_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_type_10_targets" ADD CONSTRAINT "activity_type_10_targets_demo_plot_id_fkey" FOREIGN KEY ("demo_plot_id") REFERENCES "demo_plots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_type_10_targets" ADD CONSTRAINT "activity_type_10_targets_showcase_product_id_fkey" FOREIGN KEY ("showcase_product_id") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_type_10_products" ADD CONSTRAINT "activity_type_10_products_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_type_10_products" ADD CONSTRAINT "activity_type_10_products_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "activity_type_10_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_type_10_products" ADD CONSTRAINT "activity_type_10_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_type_10_result" ADD CONSTRAINT "activity_type_10_result_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_type_10_result" ADD CONSTRAINT "activity_type_10_result_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "activity_type_10_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

