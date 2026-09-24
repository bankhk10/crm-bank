-- CreateEnum
CREATE TYPE "PromotionalMaterialStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "ActivityPlan" ADD COLUMN IF NOT EXISTS "details" JSONB;

-- CreateTable
CREATE TABLE IF NOT EXISTS "promotional_materials" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "brand" TEXT,
    "status" "PromotionalMaterialStatus" NOT NULL DEFAULT 'ACTIVE',
    "unit" TEXT,
    "price" DECIMAL(15,2) DEFAULT 0,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "promotional_materials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "promotional_materials_sku_key" ON "promotional_materials"("sku");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "promotional_materials_sku_idx" ON "promotional_materials"("sku");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "promotional_materials_category_idx" ON "promotional_materials"("category");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "promotional_materials_status_idx" ON "promotional_materials"("status");
