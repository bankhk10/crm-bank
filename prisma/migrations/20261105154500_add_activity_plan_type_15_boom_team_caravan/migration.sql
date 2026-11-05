-- CreateTable: activity_type_15_targets
CREATE TABLE IF NOT EXISTS "activity_type_15_targets" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "store_id" TEXT,
    "subdealer_id" TEXT,
    "is_sub_dealer" BOOLEAN NOT NULL DEFAULT false,
    "is_unregistered_subdealer" BOOLEAN NOT NULL DEFAULT false,
    "sub_dealer_store" TEXT,
    "village" TEXT,
    "objective" TEXT,
    "detail" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_type_15_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable: activity_type_15_results
CREATE TABLE IF NOT EXISTS "activity_type_15_results" (
    "id" TEXT NOT NULL,
    "activity_plan_id" TEXT NOT NULL,
    "target_id" TEXT,
    "detail" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_type_15_results_pkey" PRIMARY KEY ("id")
);

-- AlterTable: activity_attachments
ALTER TABLE "activity_attachments" ADD COLUMN IF NOT EXISTS "type_15_result_id" TEXT;

-- CreateIndex: activity_type_15_targets
CREATE INDEX IF NOT EXISTS "activity_type_15_targets_activity_plan_id_idx" ON "activity_type_15_targets"("activity_plan_id");
CREATE INDEX IF NOT EXISTS "activity_type_15_targets_store_id_idx" ON "activity_type_15_targets"("store_id");
CREATE INDEX IF NOT EXISTS "activity_type_15_targets_subdealer_id_idx" ON "activity_type_15_targets"("subdealer_id");

-- CreateIndex: activity_type_15_results
CREATE INDEX IF NOT EXISTS "activity_type_15_results_activity_plan_id_idx" ON "activity_type_15_results"("activity_plan_id");
CREATE INDEX IF NOT EXISTS "activity_type_15_results_target_id_idx" ON "activity_type_15_results"("target_id");

-- CreateIndex: activity_attachments
CREATE INDEX IF NOT EXISTS "activity_attachments_type_15_result_id_idx" ON "activity_attachments"("type_15_result_id");

-- AddForeignKey: activity_type_15_targets
ALTER TABLE "activity_type_15_targets" DROP CONSTRAINT IF EXISTS "activity_type_15_targets_activity_plan_id_fkey";
ALTER TABLE "activity_type_15_targets" ADD CONSTRAINT "activity_type_15_targets_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "activity_type_15_targets" DROP CONSTRAINT IF EXISTS "activity_type_15_targets_store_id_fkey";
ALTER TABLE "activity_type_15_targets" ADD CONSTRAINT "activity_type_15_targets_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "activity_type_15_targets" DROP CONSTRAINT IF EXISTS "activity_type_15_targets_subdealer_id_fkey";
ALTER TABLE "activity_type_15_targets" ADD CONSTRAINT "activity_type_15_targets_subdealer_id_fkey" FOREIGN KEY ("subdealer_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: activity_type_15_results
ALTER TABLE "activity_type_15_results" DROP CONSTRAINT IF EXISTS "activity_type_15_results_activity_plan_id_fkey";
ALTER TABLE "activity_type_15_results" ADD CONSTRAINT "activity_type_15_results_activity_plan_id_fkey" FOREIGN KEY ("activity_plan_id") REFERENCES "activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "activity_type_15_results" DROP CONSTRAINT IF EXISTS "activity_type_15_results_target_id_fkey";
ALTER TABLE "activity_type_15_results" ADD CONSTRAINT "activity_type_15_results_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "activity_type_15_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: activity_attachments
ALTER TABLE "activity_attachments" DROP CONSTRAINT IF EXISTS "activity_attachments_type_15_result_id_fkey";
ALTER TABLE "activity_attachments" ADD CONSTRAINT "activity_attachments_type_15_result_id_fkey" FOREIGN KEY ("type_15_result_id") REFERENCES "activity_type_15_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

