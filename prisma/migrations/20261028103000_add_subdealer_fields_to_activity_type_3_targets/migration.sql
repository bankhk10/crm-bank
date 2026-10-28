-- AlterTable
ALTER TABLE "activity_type_3_targets" ADD COLUMN IF NOT EXISTS "subdealer_id" TEXT;
ALTER TABLE "activity_type_3_targets" ADD COLUMN IF NOT EXISTS "is_unregistered_subdealer" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "activity_type_3_targets_subdealer_id_idx" ON "activity_type_3_targets"("subdealer_id");

-- AddForeignKey
ALTER TABLE "activity_type_3_targets" ADD CONSTRAINT "activity_type_3_targets_subdealer_id_fkey" FOREIGN KEY ("subdealer_id") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

