import { db } from "@/lib/db";
import { ShipmentRepository } from "../infrastructure/shipment.repository";

/**
 * Use Case: Get all Shipments for a Sale, with remaining quantities computed.
 */
export async function getShipmentsUseCase(saleId: string) {
  const [shipments, saleItems] = await Promise.all([
    ShipmentRepository.getShipmentsBySaleId(saleId),
    db.saleItem.findMany({
      where: { saleId },
      select: {
        id: true,
        productId: true,
        productCode: true,
        name: true,
        unit: true,
        quantity: true,
      },
    }),
  ]);

  // คำนวณ allocated quantity ต่อ SaleItem (non-cancelled shipments)
  const allocatedMap = await ShipmentRepository.getAllocatedQuantityPerSaleItem(saleId);

  const remainingByItem = saleItems.map((item) => ({
    saleItemId: item.id,
    productCode: item.productCode,
    productName: item.name,
    unit: item.unit,
    totalQuantity: item.quantity,
    allocatedQuantity: allocatedMap.get(item.id) ?? 0,
    remainingQuantity: item.quantity - (allocatedMap.get(item.id) ?? 0),
  }));

  return { shipments, remainingByItem };
}

/**
 * Use Case: Get a single Shipment by ID (for PDF etc.)
 */
export async function getShipmentByIdUseCase(shipmentId: string) {
  const shipment = await ShipmentRepository.getShipmentById(shipmentId);
  if (!shipment) throw new Error("ไม่พบการจัดส่ง");
  return shipment;
}
