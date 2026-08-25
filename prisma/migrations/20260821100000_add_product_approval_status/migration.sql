-- AlterEnum
CREATE TYPE "ProductStatus_new" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING_APPROVAL');
ALTER TABLE "Product" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Product" ALTER COLUMN "status" TYPE "ProductStatus_new" USING ("status"::text::"ProductStatus_new");
ALTER TABLE "SaleItem" ALTER COLUMN "status" TYPE "ProductStatus_new" USING ("status"::text::"ProductStatus_new");
ALTER TYPE "ProductStatus" RENAME TO "ProductStatus_old";
ALTER TYPE "ProductStatus_new" RENAME TO "ProductStatus";
DROP TYPE "ProductStatus_old";

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "status" SET DEFAULT 'PENDING_APPROVAL',
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "approvedById" TEXT;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

