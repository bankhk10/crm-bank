-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "billDiscount" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "shippingDiscount" DECIMAL(15,2) NOT NULL DEFAULT 0;
