-- Drop legacy / previous tables if they exist
DROP TABLE IF EXISTS "activity_type_7a_spray_externals" CASCADE;
DROP TABLE IF EXISTS "activity_type_7a_actual_products" CASCADE;
DROP TABLE IF EXISTS "activity_type_7a_irrigations" CASCADE;
DROP TABLE IF EXISTS "activity_type_7a_results" CASCADE;
DROP TABLE IF EXISTS "activity_type_7a_products" CASCADE;
DROP TABLE IF EXISTS "activity_type_7a_targets" CASCADE;

DROP TABLE IF EXISTS "activity_type_7b_spray_externals" CASCADE;
DROP TABLE IF EXISTS "activity_type_7b_spray_products" CASCADE;
DROP TABLE IF EXISTS "activity_type_7b_spray_rounds" CASCADE;
DROP TABLE IF EXISTS "activity_type_7b_results" CASCADE;
DROP TABLE IF EXISTS "activity_type_7b_products" CASCADE;
DROP TABLE IF EXISTS "activity_type_7b_targets" CASCADE;
DROP TABLE IF EXISTS "activity_plan_type_7b_products" CASCADE;
DROP TABLE IF EXISTS "activity_plan_type_7b_plots" CASCADE;
DROP TABLE IF EXISTS "activity_plan_type_7b" CASCADE;

DROP TABLE IF EXISTS "activity_type_13_spray_externals" CASCADE;
DROP TABLE IF EXISTS "activity_type_13_spray_products" CASCADE;
DROP TABLE IF EXISTS "activity_type_13_spray_rounds" CASCADE;
DROP TABLE IF EXISTS "activity_type_13_results" CASCADE;
DROP TABLE IF EXISTS "activity_type_13_products" CASCADE;
DROP TABLE IF EXISTS "activity_type_13_targets" CASCADE;
DROP TABLE IF EXISTS "activity_plan_type_13_products" CASCADE;
DROP TABLE IF EXISTS "activity_plan_type_13_plots" CASCADE;
DROP TABLE IF EXISTS "activity_plan_type_13" CASCADE;

DROP TABLE IF EXISTS "activity_type_14_products_used" CASCADE;
DROP TABLE IF EXISTS "activity_type_14_results" CASCADE;
DROP TABLE IF EXISTS "activity_type_14_products" CASCADE;
DROP TABLE IF EXISTS "activity_type_14_targets" CASCADE;
DROP TABLE IF EXISTS "activity_plan_type_14_products" CASCADE;
DROP TABLE IF EXISTS "activity_plan_type_14_plots" CASCADE;
DROP TABLE IF EXISTS "activity_plan_type_14" CASCADE;

-- =============================================================================
-- 1. TYPE 7A: จัดทำแปลงสาธิต (Demo Plot Establishment)
-- =============================================================================

CREATE TABLE "activity_type_7a_targets" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "plot_name" TEXT NOT NULL,
    "store_id" TEXT,
    "dealer_name" TEXT,
    "crop_category" TEXT,
    "crop_name" TEXT,
    "custom_crop_name" TEXT,
    "area_rai" DECIMAL(10,2),
    "tree_count" INTEGER,
    "objective" TEXT,
    "demo_plot_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_7a_targets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "activity_type_7a_products" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "target_id" TEXT,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_type_7a_products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "activity_type_7a_results" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "target_id" TEXT,
    "demo_plot_id" TEXT,
    "farmer_customer_id" TEXT,
    "farmer_name" TEXT,
    "farmer_phone" TEXT,
    "is_unregistered_farmer" BOOLEAN NOT NULL DEFAULT false,
    "province" TEXT,
    "district" TEXT,
    "subdistrict" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "main_crop_info" TEXT,
    "planting_date" TIMESTAMP(3),
    "first_spray_date" TIMESTAMP(3),
    "next_spray_date" TIMESTAMP(3),
    "crop_age_value" INTEGER,
    "crop_age_unit" TEXT,
    "growth_stage" TEXT,
    "spray_method" TEXT,
    "has_external_chemicals" BOOLEAN NOT NULL DEFAULT false,
    "spray_equipment" TEXT,
    "other_equipment" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_7a_results_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "activity_type_7a_irrigations" (
    "id" TEXT NOT NULL,
    "result_id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_type_7a_irrigations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "activity_type_7a_actual_products" (
    "id" TEXT NOT NULL,
    "result_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT,
    "is_planned" BOOLEAN NOT NULL DEFAULT false,
    "withdrawn_quantity" DECIMAL(10,2),
    "actual_quantity" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "extra_quantity" DECIMAL(10,2),
    "actual_rate" TEXT,
    "unit" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_type_7a_actual_products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "activity_type_7a_spray_externals" (
    "id" TEXT NOT NULL,
    "result_id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "active_ingredient" TEXT,
    "formula" TEXT NOT NULL,
    "custom_formula" TEXT,
    "application_rate" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_type_7a_spray_externals_pkey" PRIMARY KEY ("id")
);

-- =============================================================================
-- 2. TYPE 7B: ติดตามแปลงสาธิต (Demo Plot Follow-up)
-- =============================================================================

CREATE TABLE "activity_type_7b_targets" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "demo_plot_id" TEXT NOT NULL,
    "source_activity_plan_id" TEXT,
    "plot_name" TEXT,
    "crop_name" TEXT,
    "owner_name" TEXT,
    "province" TEXT,
    "district" TEXT,
    "area_rai" DECIMAL(10,2),
    "tree_count" INTEGER,
    "dealer_name" TEXT,
    "objective" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_7b_targets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "activity_type_7b_products" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "target_id" TEXT,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_type_7b_products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "activity_type_7b_results" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "target_id" TEXT,
    "demo_plot_id" TEXT NOT NULL,
    "visit_date" TIMESTAMP(3) NOT NULL,
    "days_since_start" INTEGER NOT NULL DEFAULT 0,
    "crop_condition" TEXT,
    "growth_stage" TEXT,
    "crop_problem_desc" TEXT,
    "product_response" TEXT,
    "product_problem_desc" TEXT,
    "next_spray_date" TIMESTAMP(3),
    "notes" TEXT,
    "plot_status" "DemoPlotStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "final_harvest_date" TIMESTAMP(3),
    "demo_yield_kg" DECIMAL(12,2),
    "control_yield_kg" DECIMAL(12,2),
    "farmer_satisfaction" INTEGER,
    "commercial_potential" TEXT,
    "final_summary_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_7b_results_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "activity_type_7b_spray_rounds" (
    "id" TEXT NOT NULL,
    "result_id" TEXT NOT NULL,
    "round_number" INTEGER NOT NULL DEFAULT 1,
    "spray_date" TIMESTAMP(3) NOT NULL,
    "spray_method" TEXT NOT NULL DEFAULT 'SINGLE',
    "has_external_chemicals" BOOLEAN NOT NULL DEFAULT false,
    "spray_equipment" TEXT NOT NULL,
    "other_equipment" TEXT,
    "product_response" TEXT,
    "problem_detail" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_type_7b_spray_rounds_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "activity_type_7b_spray_products" (
    "id" TEXT NOT NULL,
    "spray_round_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT,
    "is_planned" BOOLEAN NOT NULL DEFAULT false,
    "withdrawn_quantity" DECIMAL(10,2),
    "actual_quantity" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "extra_quantity" DECIMAL(10,2),
    "actual_rate" TEXT,
    "unit" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_type_7b_spray_products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "activity_type_7b_spray_externals" (
    "id" TEXT NOT NULL,
    "spray_round_id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "active_ingredient" TEXT,
    "formula" TEXT NOT NULL,
    "custom_formula" TEXT,
    "application_rate" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_type_7b_spray_externals_pkey" PRIMARY KEY ("id")
);

-- =============================================================================
-- 3. TYPE 13: ฉีดแปลงแฮตแทค (Hattack Plot Spraying)
-- =============================================================================

CREATE TABLE "activity_type_13_targets" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "plot_index" INTEGER NOT NULL DEFAULT 1,
    "plot_name" TEXT NOT NULL,
    "store_id" TEXT,
    "dealer_name" TEXT,
    "owner_name" TEXT,
    "province" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "subdistrict" TEXT,
    "village" TEXT,
    "planned_plots_count" INTEGER,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "demo_plot_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_13_targets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "activity_type_13_products" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "target_id" TEXT,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_type_13_products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "activity_type_13_results" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "target_id" TEXT,
    "demo_plot_id" TEXT,
    "plot_name" TEXT,
    "actual_plots_count" INTEGER,
    "actual_latitude" DECIMAL(10,7),
    "actual_longitude" DECIMAL(10,7),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_13_results_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "activity_type_13_spray_rounds" (
    "id" TEXT NOT NULL,
    "result_id" TEXT NOT NULL,
    "round_number" INTEGER NOT NULL DEFAULT 1,
    "spray_date" TIMESTAMP(3) NOT NULL,
    "spray_method" TEXT NOT NULL DEFAULT 'SINGLE',
    "spray_equipment" TEXT NOT NULL,
    "other_equipment" TEXT,
    "product_response" TEXT NOT NULL DEFAULT 'ปกติ',
    "problem_detail" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_type_13_spray_rounds_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "activity_type_13_spray_products" (
    "id" TEXT NOT NULL,
    "spray_round_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT,
    "quantity_used" DECIMAL(10,2) NOT NULL,
    "actual_rate" TEXT NOT NULL,
    "unit" TEXT,
    "detail" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_type_13_spray_products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "activity_type_13_spray_externals" (
    "id" TEXT NOT NULL,
    "spray_round_id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "active_ingredient" TEXT,
    "formula" TEXT NOT NULL,
    "custom_formula" TEXT,
    "application_rate" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_type_13_spray_externals_pkey" PRIMARY KEY ("id")
);

-- =============================================================================
-- 4. TYPE 14: ติดตามแปลงแฮตแทค (Hattack Follow-up)
-- =============================================================================

CREATE TABLE "activity_type_14_targets" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'EXISTING_PLOT',
    "source_activity_plan_id" TEXT,
    "demo_plot_id" TEXT,
    "plot_name" TEXT,
    "store_id" TEXT,
    "dealer_name" TEXT,
    "owner_name" TEXT,
    "crop_category" TEXT,
    "crop_name" TEXT,
    "province" TEXT,
    "district" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_14_targets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "activity_type_14_products" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "target_id" TEXT,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_type_14_products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "activity_type_14_results" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "target_id" TEXT,
    "demo_plot_id" TEXT,
    "round_number" INTEGER NOT NULL DEFAULT 1,
    "actual_visit_date" TIMESTAMP(3) NOT NULL,
    "days_after_spray" INTEGER,
    "tracking_result" TEXT NOT NULL DEFAULT 'ปกติ',
    "product_response" TEXT NOT NULL DEFAULT 'ปกติ',
    "actual_latitude" DECIMAL(10,7),
    "actual_longitude" DECIMAL(10,7),
    "additional_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_type_14_results_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "activity_type_14_products_used" (
    "id" TEXT NOT NULL,
    "result_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT,
    "quantity_used" DECIMAL(10,2) NOT NULL,
    "actual_rate" TEXT,
    "unit" TEXT,
    "detail" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_type_14_products_used_pkey" PRIMARY KEY ("id")
);

-- =============================================================================
-- 5. Attachments Alteration
-- =============================================================================

ALTER TABLE "activity_attachments" ADD COLUMN IF NOT EXISTS "type_7a_result_id" TEXT;
ALTER TABLE "activity_attachments" ADD COLUMN IF NOT EXISTS "type_7b_result_id" TEXT;
ALTER TABLE "activity_attachments" ADD COLUMN IF NOT EXISTS "type_13_result_id" TEXT;
ALTER TABLE "activity_attachments" ADD COLUMN IF NOT EXISTS "type_14_result_id" TEXT;

-- =============================================================================
-- 6. Indexes
-- =============================================================================

CREATE INDEX "activity_type_7a_targets_activity_plan_id_idx" ON "activity_type_7a_targets"("activity_plan_id");
CREATE INDEX "activity_type_7a_targets_store_id_idx" ON "activity_type_7a_targets"("store_id");
CREATE INDEX "activity_type_7a_targets_demo_plot_id_idx" ON "activity_type_7a_targets"("demo_plot_id");

CREATE INDEX "activity_type_7a_products_activity_plan_id_idx" ON "activity_type_7a_products"("activity_plan_id");
CREATE INDEX "activity_type_7a_products_target_id_idx" ON "activity_type_7a_products"("target_id");
CREATE INDEX "activity_type_7a_products_product_id_idx" ON "activity_type_7a_products"("product_id");

CREATE INDEX "activity_type_7a_results_activity_plan_id_idx" ON "activity_type_7a_results"("activity_plan_id");
CREATE INDEX "activity_type_7a_results_target_id_idx" ON "activity_type_7a_results"("target_id");
CREATE INDEX "activity_type_7a_results_demo_plot_id_idx" ON "activity_type_7a_results"("demo_plot_id");
CREATE INDEX "activity_type_7a_results_farmer_customer_id_idx" ON "activity_type_7a_results"("farmer_customer_id");

CREATE INDEX "activity_type_7a_irrigations_result_id_idx" ON "activity_type_7a_irrigations"("result_id");

CREATE INDEX "activity_type_7a_actual_products_result_id_idx" ON "activity_type_7a_actual_products"("result_id");
CREATE INDEX "activity_type_7a_actual_products_product_id_idx" ON "activity_type_7a_actual_products"("product_id");

CREATE INDEX "activity_type_7a_spray_externals_result_id_idx" ON "activity_type_7a_spray_externals"("result_id");

CREATE INDEX "activity_type_7b_targets_activity_plan_id_idx" ON "activity_type_7b_targets"("activity_plan_id");
CREATE INDEX "activity_type_7b_targets_demo_plot_id_idx" ON "activity_type_7b_targets"("demo_plot_id");
CREATE INDEX "activity_type_7b_targets_source_activity_plan_id_idx" ON "activity_type_7b_targets"("source_activity_plan_id");

CREATE INDEX "activity_type_7b_products_activity_plan_id_idx" ON "activity_type_7b_products"("activity_plan_id");
CREATE INDEX "activity_type_7b_products_target_id_idx" ON "activity_type_7b_products"("target_id");
CREATE INDEX "activity_type_7b_products_product_id_idx" ON "activity_type_7b_products"("product_id");

CREATE INDEX "activity_type_7b_results_activity_plan_id_idx" ON "activity_type_7b_results"("activity_plan_id");
CREATE INDEX "activity_type_7b_results_target_id_idx" ON "activity_type_7b_results"("target_id");
CREATE INDEX "activity_type_7b_results_demo_plot_id_idx" ON "activity_type_7b_results"("demo_plot_id");

CREATE INDEX "activity_type_7b_spray_rounds_result_id_idx" ON "activity_type_7b_spray_rounds"("result_id");

CREATE INDEX "activity_type_7b_spray_products_spray_round_id_idx" ON "activity_type_7b_spray_products"("spray_round_id");
CREATE INDEX "activity_type_7b_spray_products_product_id_idx" ON "activity_type_7b_spray_products"("product_id");

CREATE INDEX "activity_type_7b_spray_externals_spray_round_id_idx" ON "activity_type_7b_spray_externals"("spray_round_id");

CREATE INDEX "activity_type_13_targets_activity_plan_id_idx" ON "activity_type_13_targets"("activity_plan_id");
CREATE INDEX "activity_type_13_targets_store_id_idx" ON "activity_type_13_targets"("store_id");
CREATE INDEX "activity_type_13_targets_demo_plot_id_idx" ON "activity_type_13_targets"("demo_plot_id");

CREATE INDEX "activity_type_13_products_activity_plan_id_idx" ON "activity_type_13_products"("activity_plan_id");
CREATE INDEX "activity_type_13_products_target_id_idx" ON "activity_type_13_products"("target_id");
CREATE INDEX "activity_type_13_products_product_id_idx" ON "activity_type_13_products"("product_id");

CREATE INDEX "activity_type_13_results_activity_plan_id_idx" ON "activity_type_13_results"("activity_plan_id");
CREATE INDEX "activity_type_13_results_target_id_idx" ON "activity_type_13_results"("target_id");
CREATE INDEX "activity_type_13_results_demo_plot_id_idx" ON "activity_type_13_results"("demo_plot_id");

CREATE INDEX "activity_type_13_spray_rounds_result_id_idx" ON "activity_type_13_spray_rounds"("result_id");

CREATE INDEX "activity_type_13_spray_products_spray_round_id_idx" ON "activity_type_13_spray_products"("spray_round_id");
CREATE INDEX "activity_type_13_spray_products_product_id_idx" ON "activity_type_13_spray_products"("product_id");

CREATE INDEX "activity_type_13_spray_externals_spray_round_id_idx" ON "activity_type_13_spray_externals"("spray_round_id");

CREATE INDEX "activity_type_14_targets_activity_plan_id_idx" ON "activity_type_14_targets"("activity_plan_id");
CREATE INDEX "activity_type_14_targets_source_activity_plan_id_idx" ON "activity_type_14_targets"("source_activity_plan_id");
CREATE INDEX "activity_type_14_targets_demo_plot_id_idx" ON "activity_type_14_targets"("demo_plot_id");
CREATE INDEX "activity_type_14_targets_store_id_idx" ON "activity_type_14_targets"("store_id");

CREATE INDEX "activity_type_14_products_activity_plan_id_idx" ON "activity_type_14_products"("activity_plan_id");
CREATE INDEX "activity_type_14_products_target_id_idx" ON "activity_type_14_products"("target_id");
CREATE INDEX "activity_type_14_products_product_id_idx" ON "activity_type_14_products"("product_id");

CREATE INDEX "activity_type_14_results_activity_plan_id_idx" ON "activity_type_14_results"("activity_plan_id");
CREATE INDEX "activity_type_14_results_target_id_idx" ON "activity_type_14_results"("target_id");
CREATE INDEX "activity_type_14_results_demo_plot_id_idx" ON "activity_type_14_results"("demo_plot_id");

CREATE INDEX "activity_type_14_products_used_result_id_idx" ON "activity_type_14_products_used"("result_id");
CREATE INDEX "activity_type_14_products_used_product_id_idx" ON "activity_type_14_products_used"("product_id");

CREATE INDEX "activity_attachments_type_7a_result_id_idx" ON "activity_attachments"("type_7a_result_id");
CREATE INDEX "activity_attachments_type_7b_result_id_idx" ON "activity_attachments"("type_7b_result_id");
CREATE INDEX "activity_attachments_type_13_result_id_idx" ON "activity_attachments"("type_13_result_id");
CREATE INDEX "activity_attachments_type_14_result_id_idx" ON "activity_attachments"("type_14_result_id");

-- =============================================================================
-- 7. Foreign Key Constraints
-- =============================================================================

-- Type 7A
ALTER TABLE "activity_type_7a_targets" ADD CONSTRAINT "activity_type_7a_targets_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_7a_targets" ADD CONSTRAINT "activity_type_7a_targets_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "activity_type_7a_targets" ADD CONSTRAINT "activity_type_7a_targets_demo_plot_id_fkey" FOREIGN KEY ("demo_plot_id") REFERENCES "demo_plots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "activity_type_7a_products" ADD CONSTRAINT "activity_type_7a_products_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_7a_products" ADD CONSTRAINT "activity_type_7a_products_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "activity_type_7a_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_7a_products" ADD CONSTRAINT "activity_type_7a_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "activity_type_7a_results" ADD CONSTRAINT "activity_type_7a_results_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_7a_results" ADD CONSTRAINT "activity_type_7a_results_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "activity_type_7a_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_7a_results" ADD CONSTRAINT "activity_type_7a_results_demo_plot_id_fkey" FOREIGN KEY ("demo_plot_id") REFERENCES "demo_plots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "activity_type_7a_results" ADD CONSTRAINT "activity_type_7a_results_farmer_customer_id_fkey" FOREIGN KEY ("farmer_customer_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "activity_type_7a_irrigations" ADD CONSTRAINT "activity_type_7a_irrigations_result_id_fkey" FOREIGN KEY ("result_id") REFERENCES "activity_type_7a_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "activity_type_7a_actual_products" ADD CONSTRAINT "activity_type_7a_actual_products_result_id_fkey" FOREIGN KEY ("result_id") REFERENCES "activity_type_7a_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_7a_actual_products" ADD CONSTRAINT "activity_type_7a_actual_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "activity_type_7a_spray_externals" ADD CONSTRAINT "activity_type_7a_spray_externals_result_id_fkey" FOREIGN KEY ("result_id") REFERENCES "activity_type_7a_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Type 7B
ALTER TABLE "activity_type_7b_targets" ADD CONSTRAINT "activity_type_7b_targets_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_7b_targets" ADD CONSTRAINT "activity_type_7b_targets_demo_plot_id_fkey" FOREIGN KEY ("demo_plot_id") REFERENCES "demo_plots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "activity_type_7b_targets" ADD CONSTRAINT "activity_type_7b_targets_source_activity_plan_id_fkey" FOREIGN KEY ("source_activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "activity_type_7b_products" ADD CONSTRAINT "activity_type_7b_products_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_7b_products" ADD CONSTRAINT "activity_type_7b_products_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "activity_type_7b_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_7b_products" ADD CONSTRAINT "activity_type_7b_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "activity_type_7b_results" ADD CONSTRAINT "activity_type_7b_results_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_7b_results" ADD CONSTRAINT "activity_type_7b_results_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "activity_type_7b_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_7b_results" ADD CONSTRAINT "activity_type_7b_results_demo_plot_id_fkey" FOREIGN KEY ("demo_plot_id") REFERENCES "demo_plots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "activity_type_7b_spray_rounds" ADD CONSTRAINT "activity_type_7b_spray_rounds_result_id_fkey" FOREIGN KEY ("result_id") REFERENCES "activity_type_7b_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "activity_type_7b_spray_products" ADD CONSTRAINT "activity_type_7b_spray_products_spray_round_id_fkey" FOREIGN KEY ("spray_round_id") REFERENCES "activity_type_7b_spray_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_7b_spray_products" ADD CONSTRAINT "activity_type_7b_spray_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "activity_type_7b_spray_externals" ADD CONSTRAINT "activity_type_7b_spray_externals_spray_round_id_fkey" FOREIGN KEY ("spray_round_id") REFERENCES "activity_type_7b_spray_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Type 13
ALTER TABLE "activity_type_13_targets" ADD CONSTRAINT "activity_type_13_targets_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_13_targets" ADD CONSTRAINT "activity_type_13_targets_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "activity_type_13_targets" ADD CONSTRAINT "activity_type_13_targets_demo_plot_id_fkey" FOREIGN KEY ("demo_plot_id") REFERENCES "demo_plots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "activity_type_13_products" ADD CONSTRAINT "activity_type_13_products_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_13_products" ADD CONSTRAINT "activity_type_13_products_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "activity_type_13_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_13_products" ADD CONSTRAINT "activity_type_13_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "activity_type_13_results" ADD CONSTRAINT "activity_type_13_results_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_13_results" ADD CONSTRAINT "activity_type_13_results_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "activity_type_13_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_13_results" ADD CONSTRAINT "activity_type_13_results_demo_plot_id_fkey" FOREIGN KEY ("demo_plot_id") REFERENCES "demo_plots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "activity_type_13_spray_rounds" ADD CONSTRAINT "activity_type_13_spray_rounds_result_id_fkey" FOREIGN KEY ("result_id") REFERENCES "activity_type_13_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "activity_type_13_spray_products" ADD CONSTRAINT "activity_type_13_spray_products_spray_round_id_fkey" FOREIGN KEY ("spray_round_id") REFERENCES "activity_type_13_spray_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_13_spray_products" ADD CONSTRAINT "activity_type_13_spray_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "activity_type_13_spray_externals" ADD CONSTRAINT "activity_type_13_spray_externals_spray_round_id_fkey" FOREIGN KEY ("spray_round_id") REFERENCES "activity_type_13_spray_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Type 14
ALTER TABLE "activity_type_14_targets" ADD CONSTRAINT "activity_type_14_targets_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_14_targets" ADD CONSTRAINT "activity_type_14_targets_source_activity_plan_id_fkey" FOREIGN KEY ("source_activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "activity_type_14_targets" ADD CONSTRAINT "activity_type_14_targets_demo_plot_id_fkey" FOREIGN KEY ("demo_plot_id") REFERENCES "demo_plots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "activity_type_14_targets" ADD CONSTRAINT "activity_type_14_targets_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "activity_type_14_products" ADD CONSTRAINT "activity_type_14_products_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_14_products" ADD CONSTRAINT "activity_type_14_products_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "activity_type_14_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_14_products" ADD CONSTRAINT "activity_type_14_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "activity_type_14_results" ADD CONSTRAINT "activity_type_14_results_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_14_results" ADD CONSTRAINT "activity_type_14_results_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "activity_type_14_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_14_results" ADD CONSTRAINT "activity_type_14_results_demo_plot_id_fkey" FOREIGN KEY ("demo_plot_id") REFERENCES "demo_plots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "activity_type_14_products_used" ADD CONSTRAINT "activity_type_14_products_used_result_id_fkey" FOREIGN KEY ("result_id") REFERENCES "activity_type_14_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_type_14_products_used" ADD CONSTRAINT "activity_type_14_products_used_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Attachments
ALTER TABLE "activity_attachments" ADD CONSTRAINT "activity_attachments_type_7a_result_id_fkey" FOREIGN KEY ("type_7a_result_id") REFERENCES "activity_type_7a_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_attachments" ADD CONSTRAINT "activity_attachments_type_7b_result_id_fkey" FOREIGN KEY ("type_7b_result_id") REFERENCES "activity_type_7b_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_attachments" ADD CONSTRAINT "activity_attachments_type_13_result_id_fkey" FOREIGN KEY ("type_13_result_id") REFERENCES "activity_type_13_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "activity_attachments" ADD CONSTRAINT "activity_attachments_type_14_result_id_fkey" FOREIGN KEY ("type_14_result_id") REFERENCES "activity_type_14_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;
