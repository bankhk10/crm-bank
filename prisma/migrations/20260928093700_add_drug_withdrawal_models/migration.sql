-- CreateEnum
CREATE TYPE "DrugWithdrawalStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'RETURNED');

-- CreateTable
CREATE TABLE "drug_withdrawals" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "status" "DrugWithdrawalStatus" NOT NULL DEFAULT 'DRAFT',
    "requested_by_id" TEXT NOT NULL,
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drug_withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drug_withdrawal_items" (
    "id" TEXT NOT NULL,
    "drug_withdrawal_id" TEXT NOT NULL,
    "demo_plot_id" TEXT,
    "plot_identifier" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drug_withdrawal_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "drug_withdrawals_activity_plan_id_key" ON "drug_withdrawals"("activity_plan_id");

-- CreateIndex
CREATE INDEX "drug_withdrawals_activity_plan_id_idx" ON "drug_withdrawals"("activity_plan_id");

-- CreateIndex
CREATE INDEX "drug_withdrawals_requested_by_id_idx" ON "drug_withdrawals"("requested_by_id");

-- CreateIndex
CREATE INDEX "drug_withdrawals_approved_by_id_idx" ON "drug_withdrawals"("approved_by_id");

-- CreateIndex
CREATE INDEX "drug_withdrawals_status_idx" ON "drug_withdrawals"("status");

-- CreateIndex
CREATE INDEX "drug_withdrawal_items_drug_withdrawal_id_idx" ON "drug_withdrawal_items"("drug_withdrawal_id");

-- CreateIndex
CREATE INDEX "drug_withdrawal_items_demo_plot_id_idx" ON "drug_withdrawal_items"("demo_plot_id");

-- CreateIndex
CREATE INDEX "drug_withdrawal_items_product_id_idx" ON "drug_withdrawal_items"("product_id");

-- AddForeignKey
ALTER TABLE "drug_withdrawals" ADD CONSTRAINT "drug_withdrawals_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drug_withdrawals" ADD CONSTRAINT "drug_withdrawals_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drug_withdrawals" ADD CONSTRAINT "drug_withdrawals_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drug_withdrawal_items" ADD CONSTRAINT "drug_withdrawal_items_drug_withdrawal_id_fkey" FOREIGN KEY ("drug_withdrawal_id") REFERENCES "drug_withdrawals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drug_withdrawal_items" ADD CONSTRAINT "drug_withdrawal_items_demo_plot_id_fkey" FOREIGN KEY ("demo_plot_id") REFERENCES "demo_plots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drug_withdrawal_items" ADD CONSTRAINT "drug_withdrawal_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
