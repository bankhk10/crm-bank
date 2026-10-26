-- AlterTable
ALTER TABLE "activity_type_9_result" DROP COLUMN IF EXISTS "summary";

-- AlterTable
ALTER TABLE "activity_type_9_targets" ADD COLUMN IF NOT EXISTS "sales_ratio" DECIMAL(8,2);
ALTER TABLE "activity_type_9_targets" ALTER COLUMN "target_attendees_count" DROP NOT NULL;

