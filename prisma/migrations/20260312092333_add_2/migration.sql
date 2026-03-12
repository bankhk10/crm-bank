-- Safe no-ops if tables/indexes don't exist yet
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'ProductGroup' AND n.nspname = 'public'
  ) AND EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ChemicalGroup_pkey'
  ) THEN
    ALTER TABLE "ProductGroup"
      RENAME CONSTRAINT "ChemicalGroup_pkey" TO "ProductGroup_pkey";
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'TradeNameGroup' AND n.nspname = 'public'
  ) AND EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProductGroupMaster_pkey'
  ) THEN
    ALTER TABLE "TradeNameGroup"
      RENAME CONSTRAINT "ProductGroupMaster_pkey" TO "TradeNameGroup_pkey";
  END IF;
END$$;

ALTER INDEX IF EXISTS "ChemicalGroup_code_key" RENAME TO "ProductGroup_code_key";
ALTER INDEX IF EXISTS "ProductGroupMaster_code_key" RENAME TO "TradeNameGroup_code_key";
