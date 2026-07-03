-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "deliveryMethod" TEXT,
ADD COLUMN     "pickupCompanyId" TEXT,
ADD COLUMN     "pickupCompanyName" TEXT,
ADD COLUMN     "shippingAddress" TEXT,
ADD COLUMN     "shippingCompanyName" TEXT;
