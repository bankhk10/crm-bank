-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AttachmentCategory" ADD VALUE 'SURVEY_BOTTLE';
ALTER TYPE "AttachmentCategory" ADD VALUE 'SURVEY_PROMO_MATERIAL';

-- AlterTable
ALTER TABLE "activity_attachments" ADD COLUMN     "survey_item_id" TEXT;

-- AlterTable
ALTER TABLE "activity_result_survey_items" ADD COLUMN     "dealer_price" DECIMAL(15,2),
ADD COLUMN     "farmer_price" DECIMAL(15,2),
ADD COLUMN     "pos_price" DECIMAL(15,2),
ADD COLUMN     "selling_points" TEXT,
ADD COLUMN     "subdealer_price" DECIMAL(15,2);

-- CreateIndex
CREATE INDEX "activity_attachments_survey_item_id_idx" ON "activity_attachments"("survey_item_id");

-- AddForeignKey
ALTER TABLE "activity_attachments" ADD CONSTRAINT "activity_attachments_survey_item_id_fkey" FOREIGN KEY ("survey_item_id") REFERENCES "activity_result_survey_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
