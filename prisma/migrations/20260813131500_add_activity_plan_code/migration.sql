-- AlterTable
ALTER TABLE "ActivityPlan" ADD COLUMN "code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ActivityPlan_code_key" ON "ActivityPlan"("code");
