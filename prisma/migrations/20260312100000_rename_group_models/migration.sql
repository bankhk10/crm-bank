-- Rename ChemicalGroup to ProductGroup
ALTER TABLE "ChemicalGroup" RENAME TO "ProductGroup";
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ChemicalGroup_pkey'
  ) THEN
    ALTER TABLE "ProductGroup" RENAME CONSTRAINT "ChemicalGroup_pkey" TO "ProductGroup_pkey";
  END IF;
END $$;
ALTER INDEX IF EXISTS "ChemicalGroup_code_key" RENAME TO "ProductGroup_code_key";

-- Rename ProductGroupMaster to TradeNameGroup (with FK update)
ALTER TABLE "ProductGroupMaster" DROP CONSTRAINT IF EXISTS "ProductGroupMaster_categoryId_fkey";
ALTER TABLE "ProductGroupMaster" RENAME TO "TradeNameGroup";
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ProductGroupMaster_pkey'
  ) THEN
    ALTER TABLE "TradeNameGroup" RENAME CONSTRAINT "ProductGroupMaster_pkey" TO "TradeNameGroup_pkey";
  END IF;
END $$;
ALTER INDEX IF EXISTS "ProductGroupMaster_code_key" RENAME TO "TradeNameGroup_code_key";
ALTER TABLE "TradeNameGroup"
  ADD CONSTRAINT "TradeNameGroup_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
