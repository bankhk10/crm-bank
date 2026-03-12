-- Rename ProductChain to ProductABCTypes and add code column

-- Drop old FK constraint before renaming column/table
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_productChainId_fkey";

-- Rename table
ALTER TABLE "ProductChain" RENAME TO "ProductABCTypes";

-- Rename primary key constraint to match new table name
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProductChain_pkey') THEN
    ALTER TABLE "ProductABCTypes"
      RENAME CONSTRAINT "ProductChain_pkey" TO "ProductABCTypes_pkey";
  END IF;
END$$;

-- Add required code column with safe default
ALTER TABLE "ProductABCTypes" ADD COLUMN "code" TEXT NOT NULL DEFAULT '';

-- Backfill code from name for existing rows
UPDATE "ProductABCTypes" SET "code" = "name" WHERE "code" = '';

-- Remove default to match Prisma schema
ALTER TABLE "ProductABCTypes" ALTER COLUMN "code" DROP DEFAULT;

-- Rename FK column in Product
ALTER TABLE "Product" RENAME COLUMN "productChainId" TO "productABCTypeId";

-- Recreate FK constraint to new table
ALTER TABLE "Product"
  ADD CONSTRAINT "Product_productABCTypeId_fkey"
  FOREIGN KEY ("productABCTypeId") REFERENCES "ProductABCTypes"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
