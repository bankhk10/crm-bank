-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "pickupCompanyId" TEXT;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_pickupCompanyId_fkey" FOREIGN KEY ("pickupCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
