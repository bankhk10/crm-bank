/*
  Warnings:

  - You are about to drop the `ActivityApprovalLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ActivityHelper` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ActivityPlan` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ActivityResultStatus" AS ENUM ('COMPLETED', 'PARTIAL', 'FAILED');

-- DropForeignKey
ALTER TABLE "ActivityApprovalLog" DROP CONSTRAINT "ActivityApprovalLog_activity_plan_id_fkey";

-- DropForeignKey
ALTER TABLE "ActivityApprovalLog" DROP CONSTRAINT "ActivityApprovalLog_user_id_fkey";

-- DropForeignKey
ALTER TABLE "ActivityHelper" DROP CONSTRAINT "ActivityHelper_activity_plan_id_fkey";

-- DropForeignKey
ALTER TABLE "ActivityHelper" DROP CONSTRAINT "ActivityHelper_approved_by_id_fkey";

-- DropForeignKey
ALTER TABLE "ActivityHelper" DROP CONSTRAINT "ActivityHelper_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "ActivityPlan" DROP CONSTRAINT "ActivityPlan_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "ActivityPlan" DROP CONSTRAINT "ActivityPlan_current_approver_id_fkey";

-- DropForeignKey
ALTER TABLE "ActivityPlan" DROP CONSTRAINT "ActivityPlan_employee_id_fkey";

-- DropTable
DROP TABLE "ActivityApprovalLog";

-- DropTable
DROP TABLE "ActivityHelper";

-- DropTable
DROP TABLE "ActivityPlan";

-- CreateTable
CREATE TABLE "activity_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "activity_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_plans" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "employee_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "activity_type_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "duration_days" INTEGER NOT NULL DEFAULT 1,
    "fiscal_year" INTEGER NOT NULL,
    "fiscal_month" INTEGER NOT NULL,
    "fiscal_quarter" INTEGER NOT NULL,
    "province" TEXT,
    "district" TEXT,
    "location" TEXT NOT NULL,
    "sales_promotion_budget_requested" DECIMAL(15,2),
    "marketing_budget_requested" DECIMAL(15,2),
    "total_budget_requested" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "sales_promotion_budget_approved" DECIMAL(15,2),
    "marketing_budget_approved" DECIMAL(15,2),
    "total_budget_approved" DECIMAL(15,2),
    "status" "ActivityStatus" NOT NULL DEFAULT 'DRAFT',
    "current_approver_employee_id" TEXT,
    "sales_promotion_approved" BOOLEAN,
    "marketing_approved" BOOLEAN,
    "sales_manager_approved" BOOLEAN,
    "submitted_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "activity_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_plan_items" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "item_order" INTEGER NOT NULL DEFAULT 0,
    "customer_name" TEXT,
    "detail" TEXT,
    "visit_topic" TEXT,
    "followup_product_name" TEXT,
    "sale_product_name" TEXT,
    "sale_quantity" INTEGER,
    "sale_unit_price" DECIMAL(15,2),
    "sale_total_price" DECIMAL(15,2),
    "collect_amount" DECIMAL(15,2),
    "survey_competitor_product" TEXT,
    "survey_store_name" TEXT,
    "issue_type" TEXT,
    "plot_activity_type" TEXT,
    "plot_owner_name" TEXT,
    "plot_product_name" TEXT,
    "plot_crop_category" TEXT,
    "plot_crop_name" TEXT,
    "plot_area_rai" DECIMAL(10,2),
    "plot_tree_count" INTEGER,
    "plot_count" INTEGER,
    "existing_plot_id" TEXT,
    "plot_growth_stage" TEXT,
    "plot_status" TEXT,
    "meeting_topic" TEXT,
    "meeting_attendees_count" INTEGER,
    "meeting_target_products" TEXT,
    "store_product_name" TEXT,
    "store_quantity_cases" INTEGER,
    "store_price_per_case" DECIMAL(15,2),
    "store_total_amount" DECIMAL(15,2),

    CONSTRAINT "activity_plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_helpers" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "department_id" TEXT,
    "department_name" TEXT,
    "status" "ActivityHelperStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "responded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "activity_helpers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_approval_logs" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" "ActivityApprovalAction" NOT NULL,
    "step" "ActivityApprovalStep" NOT NULL,
    "from_status" "ActivityStatus",
    "to_status" "ActivityStatus",
    "comment" TEXT,
    "step_duration_seconds" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_approval_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_results" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "actual_start_date" TIMESTAMP(3) NOT NULL,
    "actual_end_date" TIMESTAMP(3) NOT NULL,
    "actual_attendees_count" INTEGER,
    "result_status" "ActivityResultStatus" NOT NULL DEFAULT 'COMPLETED',
    "result_summary" TEXT,
    "problem_found" TEXT,
    "next_action" TEXT,
    "actual_sales_promotion_spent" DECIMAL(15,2),
    "actual_marketing_spent" DECIMAL(15,2),
    "actual_total_spent" DECIMAL(15,2),
    "sales_result_amount" DECIMAL(15,2),
    "sales_orders_count" INTEGER,
    "collect_result_amount" DECIMAL(15,2),
    "demo_plots_created" INTEGER,
    "demo_plots_followed_up" INTEGER,
    "distributors_count" INTEGER,
    "farmers_count" INTEGER,
    "recorded_by_id" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activity_types_code_key" ON "activity_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "activity_plans_code_key" ON "activity_plans"("code");

-- CreateIndex
CREATE INDEX "activity_plans_employee_id_idx" ON "activity_plans"("employee_id");

-- CreateIndex
CREATE INDEX "activity_plans_activity_type_id_idx" ON "activity_plans"("activity_type_id");

-- CreateIndex
CREATE INDEX "activity_plans_status_idx" ON "activity_plans"("status");

-- CreateIndex
CREATE INDEX "activity_plans_fiscal_year_fiscal_month_idx" ON "activity_plans"("fiscal_year", "fiscal_month");

-- CreateIndex
CREATE INDEX "activity_plans_fiscal_year_fiscal_quarter_idx" ON "activity_plans"("fiscal_year", "fiscal_quarter");

-- CreateIndex
CREATE INDEX "activity_plans_province_idx" ON "activity_plans"("province");

-- CreateIndex
CREATE INDEX "activity_plans_submitted_at_idx" ON "activity_plans"("submitted_at");

-- CreateIndex
CREATE INDEX "activity_plans_approved_at_idx" ON "activity_plans"("approved_at");

-- CreateIndex
CREATE INDEX "activity_plan_items_activity_plan_id_idx" ON "activity_plan_items"("activity_plan_id");

-- CreateIndex
CREATE INDEX "activity_plan_items_customer_name_idx" ON "activity_plan_items"("customer_name");

-- CreateIndex
CREATE INDEX "activity_plan_items_sale_product_name_idx" ON "activity_plan_items"("sale_product_name");

-- CreateIndex
CREATE INDEX "activity_plan_items_plot_crop_category_idx" ON "activity_plan_items"("plot_crop_category");

-- CreateIndex
CREATE INDEX "activity_plan_items_plot_owner_name_idx" ON "activity_plan_items"("plot_owner_name");

-- CreateIndex
CREATE INDEX "activity_helpers_employee_id_idx" ON "activity_helpers"("employee_id");

-- CreateIndex
CREATE INDEX "activity_helpers_status_idx" ON "activity_helpers"("status");

-- CreateIndex
CREATE INDEX "activity_helpers_department_name_idx" ON "activity_helpers"("department_name");

-- CreateIndex
CREATE UNIQUE INDEX "activity_helpers_activity_plan_id_employee_id_key" ON "activity_helpers"("activity_plan_id", "employee_id");

-- CreateIndex
CREATE INDEX "activity_approval_logs_activity_plan_id_idx" ON "activity_approval_logs"("activity_plan_id");

-- CreateIndex
CREATE INDEX "activity_approval_logs_action_idx" ON "activity_approval_logs"("action");

-- CreateIndex
CREATE INDEX "activity_approval_logs_step_idx" ON "activity_approval_logs"("step");

-- CreateIndex
CREATE INDEX "activity_approval_logs_created_at_idx" ON "activity_approval_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "activity_results_activity_plan_id_key" ON "activity_results"("activity_plan_id");

-- CreateIndex
CREATE INDEX "activity_results_activity_plan_id_idx" ON "activity_results"("activity_plan_id");

-- CreateIndex
CREATE INDEX "activity_results_result_status_idx" ON "activity_results"("result_status");

-- CreateIndex
CREATE INDEX "activity_results_actual_start_date_idx" ON "activity_results"("actual_start_date");

-- AddForeignKey
ALTER TABLE "activity_plans" ADD CONSTRAINT "activity_plans_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_plans" ADD CONSTRAINT "activity_plans_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_plans" ADD CONSTRAINT "activity_plans_current_approver_employee_id_fkey" FOREIGN KEY ("current_approver_employee_id") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_plans" ADD CONSTRAINT "activity_plans_activity_type_id_fkey" FOREIGN KEY ("activity_type_id") REFERENCES "activity_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_plan_items" ADD CONSTRAINT "activity_plan_items_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_helpers" ADD CONSTRAINT "activity_helpers_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_helpers" ADD CONSTRAINT "activity_helpers_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_helpers" ADD CONSTRAINT "activity_helpers_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_approval_logs" ADD CONSTRAINT "activity_approval_logs_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_approval_logs" ADD CONSTRAINT "activity_approval_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_results" ADD CONSTRAINT "activity_results_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_results" ADD CONSTRAINT "activity_results_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
