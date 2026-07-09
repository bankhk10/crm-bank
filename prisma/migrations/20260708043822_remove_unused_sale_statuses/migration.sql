-- Update legacy status values in Sale
UPDATE "Sale" SET "status" = 'APPROVED' WHERE "status"::text = 'AWAITING_PAYMENT';
UPDATE "Sale" SET "status" = 'DELIVERY_COMPLETED' WHERE "status"::text = 'DELIVERED';
UPDATE "Sale" SET "status" = 'PENDING_APPROVAL' WHERE "status"::text = 'PENDING';
UPDATE "Sale" SET "status" = 'CANCELLED' WHERE "status"::text = 'EXPIRED';

-- Update legacy status values in SaleStatusHistory
UPDATE "SaleStatusHistory" SET "status" = 'APPROVED' WHERE "status"::text = 'AWAITING_PAYMENT';
UPDATE "SaleStatusHistory" SET "status" = 'DELIVERY_COMPLETED' WHERE "status"::text = 'DELIVERED';
UPDATE "SaleStatusHistory" SET "status" = 'PENDING_APPROVAL' WHERE "status"::text = 'PENDING';
UPDATE "SaleStatusHistory" SET "status" = 'CANCELLED' WHERE "status"::text = 'EXPIRED';

-- AlterEnum
CREATE TYPE "SaleStatus_new" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PAID', 'AWAITING_DELIVERY', 'DELIVERY_COMPLETED', 'PARTIALLY_DELIVERED', 'OVERDUE', 'WAITING_FOR_CORRECTION', 'CANCELLED', 'COMPLETED');
ALTER TABLE "Sale" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Sale" ALTER COLUMN "status" TYPE "SaleStatus_new" USING ("status"::text::"SaleStatus_new");
ALTER TABLE "SaleStatusHistory" ALTER COLUMN "status" TYPE "SaleStatus_new" USING ("status"::text::"SaleStatus_new");
ALTER TYPE "SaleStatus" RENAME TO "SaleStatus_old";
ALTER TYPE "SaleStatus_new" RENAME TO "SaleStatus";
DROP TYPE "SaleStatus_old";
ALTER TABLE "Sale" ALTER COLUMN "status" SET DEFAULT 'PENDING_APPROVAL';
