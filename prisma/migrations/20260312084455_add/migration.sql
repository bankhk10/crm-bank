-- Safe no-op if ProductABCTypes doesn't exist yet
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'ProductABCTypes' AND n.nspname = 'public'
  ) AND EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProductChain_pkey'
  ) THEN
    ALTER TABLE "ProductABCTypes"
      RENAME CONSTRAINT "ProductChain_pkey" TO "ProductABCTypes_pkey";
  END IF;
END$$;
