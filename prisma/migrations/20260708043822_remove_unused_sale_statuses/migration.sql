-- AlterEnum
CREATE TYPE "SaleStatus_new" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PAID', 'AWAITING_DELIVERY', 'DELIVERY_COMPLETED', 'PARTIALLY_DELIVERED', 'OVERDUE', 'WAITING_FOR_CORRECTION', 'CANCELLED', 'COMPLETED');
ALTER TABLE "Sale" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Sale" ALTER COLUMN "status" TYPE "SaleStatus_new" USING ("status"::text::"SaleStatus_new");
ALTER TABLE "SaleStatusHistory" ALTER COLUMN "status" TYPE "SaleStatus_new" USING ("status"::text::"SaleStatus_new");
ALTER TYPE "SaleStatus" RENAME TO "SaleStatus_old";
ALTER TYPE "SaleStatus_new" RENAME TO "SaleStatus";
DROP TYPE "SaleStatus_old";
ALTER TABLE "Sale" ALTER COLUMN "status" SET DEFAULT 'PENDING_APPROVAL';
