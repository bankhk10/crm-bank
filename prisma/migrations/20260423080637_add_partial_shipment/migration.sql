-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "SaleStatus" ADD VALUE 'PARTIALLY_DELIVERED';

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "hasPartialDelivery" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "shipmentNumber" INTEGER NOT NULL,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledDate" TIMESTAMP(3),
    "actualDate" TIMESTAMP(3),
    "shippingCompanyId" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentItem" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "saleItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "ShipmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Shipment_saleId_idx" ON "Shipment"("saleId");

-- CreateIndex
CREATE INDEX "Shipment_shippingCompanyId_idx" ON "Shipment"("shippingCompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_saleId_shipmentNumber_key" ON "Shipment"("saleId", "shipmentNumber");

-- CreateIndex
CREATE INDEX "ShipmentItem_shipmentId_idx" ON "ShipmentItem"("shipmentId");

-- CreateIndex
CREATE INDEX "ShipmentItem_saleItemId_idx" ON "ShipmentItem"("saleItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ShipmentItem_shipmentId_saleItemId_key" ON "ShipmentItem"("shipmentId", "saleItemId");

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_shippingCompanyId_fkey" FOREIGN KEY ("shippingCompanyId") REFERENCES "ShippingCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentItem" ADD CONSTRAINT "ShipmentItem_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
