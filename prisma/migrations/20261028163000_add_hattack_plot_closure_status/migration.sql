-- AlterTable
ALTER TABLE "activity_type_13_targets" ADD COLUMN IF NOT EXISTS "closed_at" TIMESTAMP(3);
ALTER TABLE "activity_type_13_targets" ADD COLUMN IF NOT EXISTS "closure_notes" TEXT;

-- AlterTable
ALTER TABLE "activity_type_14_results" ADD COLUMN IF NOT EXISTS "plot_status" "DemoPlotStatus" DEFAULT 'IN_PROGRESS';
ALTER TABLE "activity_type_14_results" ADD COLUMN IF NOT EXISTS "closure_notes" TEXT;

