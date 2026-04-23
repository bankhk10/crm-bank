-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "totalAmount" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ShipmentItem" ADD COLUMN     "totalPrice" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "unitPrice" DECIMAL(15,2) NOT NULL DEFAULT 0;
