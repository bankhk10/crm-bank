import { db } from "@/lib/db";
import { ShipmentRepository } from "../infrastructure/shipment.repository";
import { createShipmentSchema } from "./shipment-validations";

/**
 * Use Case: Create a new Shipment for a Sale (Split / Partial Delivery).
 *
 * Business Rules:
 * - Sum of new quantities + already allocated quantities ≤ original SaleItem.quantity
 * - Sale must be in a shippable status
 * - Updates Sale.hasPartialDelivery = true and Sale.status = PARTIALLY_DELIVERED
 */
export async function createShipmentUseCase(
  saleId: string,
  userId: string,
  input: unknown,
) {
  const validatedData = createShipmentSchema.parse(input);

  // 1. ดึงข้อมูล Sale + SaleItems
  const sale = await db.sale.findUnique({
    where: { id: saleId },
    include: { items: true },
  });
  if (!sale) throw new Error("ไม่พบรายการขาย");

  // 2. ตรวจสอบสถานะ Sale
  const allowedStatuses = [
    "APPROVED",
    "AWAITING_PAYMENT",
    "PAID",
    "AWAITING_DELIVERY",
    "PARTIALLY_DELIVERED",
  ];
  if (!allowedStatuses.includes(sale.status)) {
    throw new Error(
      `ไม่สามารถเพิ่มการจัดส่งได้ในสถานะ '${sale.status}'`,
    );
  }

  // 3. ตรวจสอบว่า saleItemId ในการส่งมาตรงกับ SaleItem จริงๆ
  const saleItemMap = new Map(sale.items.map((item) => [item.id, item]));
  for (const reqItem of validatedData.items) {
    if (!saleItemMap.has(reqItem.saleItemId)) {
      throw new Error(`ไม่พบรายการสินค้า ${reqItem.saleItemId} ในรายการขายนี้`);
    }
  }

  // 4. ตรวจสอบ remaining quantity (ที่ยังไม่ถูก allocate ใน active shipments)
  const allocatedMap = await ShipmentRepository.getAllocatedQuantityPerSaleItem(saleId);

  for (const reqItem of validatedData.items) {
    const saleItem = saleItemMap.get(reqItem.saleItemId)!;
    const alreadyAllocated = allocatedMap.get(reqItem.saleItemId) ?? 0;
    const remaining = saleItem.quantity - alreadyAllocated;

    if (reqItem.quantity > remaining) {
      throw new Error(
        `สินค้า '${saleItem.name || saleItem.productCode}': ` +
          `ต้องการส่ง ${reqItem.quantity} แต่เหลือได้อีก ${remaining} เท่านั้น`,
      );
    }
  }

  // 5. สร้าง Shipment ใน transaction
  const shipment = await db.$transaction(async (tx) => {
    const newShipment = await ShipmentRepository.createShipment(
      saleId,
      {
        scheduledDate: validatedData.scheduledDate
          ? new Date(validatedData.scheduledDate)
          : null,
        salesOrderNumber: validatedData.salesOrderNumber ?? null,
        shippingCompanyId: validatedData.shippingCompanyId ?? null,
        notes: validatedData.notes ?? null,
        createdById: userId,
        items: validatedData.items,
      },
      tx,
    );

    // 6. อัพเดท Sale flags
    const newSaleStatus =
      sale.status === "PARTIALLY_DELIVERED" ? "PARTIALLY_DELIVERED" : sale.status;

    await tx.sale.update({
      where: { id: saleId },
      data: {
        hasPartialDelivery: true,
        // ยังไม่เปลี่ยน status ณ ตอนสร้าง — จะเปลี่ยนเมื่อยืนยัน IN_TRANSIT
        status: newSaleStatus,
      },
    });

    return newShipment;
  });

  return shipment;
}
