import { db } from "@/lib/db";
import { ShipmentRepository } from "../infrastructure/shipment.repository";
import { updateShipmentSchema } from "./shipment-validations";
import { confirmStockDeductionForShipmentUseCase } from "@/modules/products/application";

/**
 * Use Case: Update a Shipment's status and metadata.
 *
 * Status transitions:
 *   PENDING → IN_TRANSIT  (กำลังส่ง → อัพเดท Sale.status = PARTIALLY_DELIVERED)
 *   IN_TRANSIT → DELIVERED (ส่งเสร็จแล้ว → หักสต็อก → ตรวจสอบว่าครบหรือยัง)
 *   * → CANCELLED         (ยกเลิก → ถ้า DELIVERED อยู่ ให้คืนสต็อก)
 */
export async function updateShipmentUseCase(
  shipmentId: string,
  userId: string,
  input: unknown,
) {
  const validatedData = updateShipmentSchema.parse(input);

  // ดึงข้อมูล Shipment ปัจจุบัน
  const shipment = await ShipmentRepository.getShipmentById(shipmentId);
  if (!shipment) throw new Error("ไม่พบการจัดส่ง");

  const { sale } = shipment;
  const prevStatus = shipment.status;
  const newStatus = validatedData.status;

  // Validate transitions
  if (newStatus) {
    const validTransitions: Record<string, string[]> = {
      PENDING: ["IN_TRANSIT", "CANCELLED"],
      IN_TRANSIT: ["DELIVERED", "CANCELLED"],
      DELIVERED: ["CANCELLED"],
      CANCELLED: [],
    };
    if (!validTransitions[prevStatus]?.includes(newStatus)) {
      throw new Error(
        `ไม่สามารถเปลี่ยนสถานะจาก '${prevStatus}' เป็น '${newStatus}' ได้`,
      );
    }
  }

  // Build update payload
  const updatePayload: Parameters<typeof ShipmentRepository.updateShipment>[1] = {
    ...(validatedData.status && { status: validatedData.status }),
    ...(validatedData.scheduledDate !== undefined && {
      scheduledDate: validatedData.scheduledDate
        ? new Date(validatedData.scheduledDate)
        : null,
    }),
    ...(validatedData.actualDate !== undefined && {
      actualDate: validatedData.actualDate ? new Date(validatedData.actualDate) : null,
    }),
    ...(validatedData.shippingCompanyId !== undefined && {
      shippingCompanyId: validatedData.shippingCompanyId,
    }),
    ...(validatedData.salesOrderNumber !== undefined && {
      salesOrderNumber: validatedData.salesOrderNumber,
    }),
    ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
  };

  // ถ้าเปลี่ยนเป็น DELIVERED และไม่มี actualDate → ใช้เวลาปัจจุบัน
  if (newStatus === "DELIVERED" && !updatePayload.actualDate) {
    updatePayload.actualDate = new Date();
  }

  await db.$transaction(async (tx) => {
    // 1. อัพเดท Shipment record
    await ShipmentRepository.updateShipment(shipmentId, updatePayload, tx);

    // 2. เมื่อ DELIVERED: หักสต็อกตามจำนวนที่ส่งจริง
    if (newStatus === "DELIVERED") {
      await confirmStockDeductionForShipmentUseCase(shipmentId, tx);

      // 3. ตรวจสอบว่าทุก SaleItem ส่งครบแล้วหรือยัง
      const isFullyDelivered = await ShipmentRepository.isFullyDelivered(sale.id, tx);

      await tx.sale.update({
        where: { id: sale.id },
        data: {
          status: isFullyDelivered ? "DELIVERY_COMPLETED" : "PARTIALLY_DELIVERED",
          // ตั้ง deliveryDate ของ Sale เป็น actualDate ของ shipment ล่าสุด (เพื่อ compatibility)
          ...(isFullyDelivered && {
            deliveryDate: updatePayload.actualDate ?? new Date(),
          }),
        },
      });
    }

    // 4. เมื่อ IN_TRANSIT: อัพเดท Sale.status = PARTIALLY_DELIVERED (ถ้ายังไม่ใช่)
    if (newStatus === "IN_TRANSIT") {
      const currentSale = await tx.sale.findUnique({
        where: { id: sale.id },
        select: { status: true },
      });
      const alreadyDelivering = [
        "PARTIALLY_DELIVERED",
        "DELIVERY_COMPLETED",
        "COMPLETED",
      ].includes(currentSale?.status ?? "");

      if (!alreadyDelivering) {
        await tx.sale.update({
          where: { id: sale.id },
          data: { status: "PARTIALLY_DELIVERED" },
        });
      }
    }

    // 5. เมื่อ CANCELLED ที่เคย DELIVERED: คืนสต็อก (reverse)
    if (newStatus === "CANCELLED" && prevStatus === "DELIVERED") {
      // คืน reservedQuantity และ physicalBalance ต่อสินค้าแต่ละรายการ
      for (const item of shipment.items) {
        const productId = item.saleItem.productId;
        await tx.productStock.update({
          where: { productId },
          data: {
            reservedQuantity: { increment: item.quantity },
            physicalBalance: { increment: item.quantity },
            availableQuantity: { decrement: item.quantity },
          },
        });
      }

      // Re-evaluate Sale.status หลังยกเลิก
      const isStillFullyDelivered = await ShipmentRepository.isFullyDelivered(
        sale.id,
        tx,
      );
      const hasAnyDelivered = await tx.shipment.count({
        where: { saleId: sale.id, status: "DELIVERED" },
      });

      let newSaleStatus: string;
      if (isStillFullyDelivered) {
        newSaleStatus = "DELIVERY_COMPLETED";
      } else if (hasAnyDelivered > 0) {
        newSaleStatus = "PARTIALLY_DELIVERED";
      } else {
        newSaleStatus = "AWAITING_DELIVERY";
      }

      await tx.sale.update({
        where: { id: sale.id },
        data: { status: newSaleStatus as any },
      });
    }
  });

  return ShipmentRepository.getShipmentById(shipmentId);
}
