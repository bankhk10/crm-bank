-- AlterTable
ALTER TABLE "activity_type_1_targets" 
ADD COLUMN IF NOT EXISTS "is_sub_dealer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "subdealer_id" TEXT,
ADD COLUMN IF NOT EXISTS "is_unregistered_subdealer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "sub_dealer_store" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "activity_type_1_targets_subdealer_id_idx" 
ON "activity_type_1_targets"("subdealer_id");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'activity_type_1_targets_subdealer_id_fkey'
  ) THEN
    ALTER TABLE "activity_type_1_targets" 
    ADD CONSTRAINT "activity_type_1_targets_subdealer_id_fkey" 
    FOREIGN KEY ("subdealer_id") REFERENCES "Customer"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
