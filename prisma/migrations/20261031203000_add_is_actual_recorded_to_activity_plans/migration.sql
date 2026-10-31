-- AlterTable
ALTER TABLE "activity_plans" ADD COLUMN IF NOT EXISTS "is_actual_recorded" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "activity_plans_is_actual_recorded_idx" ON "activity_plans"("is_actual_recorded");

-- Backfill existing actual records
UPDATE "activity_plans"
SET "is_actual_recorded" = true
WHERE id IN (
  SELECT activity_plan_id FROM activity_results
);

