import { db } from "@/lib/db";
import { ShipmentRepository } from "../infrastructure/shipment.repository";
import { updateShipmentSchema } from "./shipment-validations";
import { confirmStockDeductionForShipmentUseCase } from "@/modules/products/application";
import { restoreCreditLimit } from "@/modules/sales/application/order-management";
import { finalizePointsForSaleUseCase as finalizePointsForSale } from "@/modules/points";
import { finalizePromotionalBudgetForSaleUseCase as finalizePromotionalBudgetForSale } from "@/modules/credit-limits/application";

/**
 * Use Case: Update a Shipment's status and metadata.
 *
 * Status transitions:
 *   PENDING → IN_TRANSIT  (ยืนยันจัดส่ง → หักสต็อก → นับ Invoice → ตรวจสอบว่าส่งครบหรือยัง)
 *   IN_TRANSIT → DELIVERED (ยืนยันส่งเสร็จ → บันทึก actualDate เท่านั้น ไม่ต้องหักสต็อกซ้ำ)
 *   * → CANCELLED         (ยกเลิก → ถ้า IN_TRANSIT หรือ DELIVERED อยู่ ให้คืนสต็อก)
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
  let newStatus = validatedData.status;

  // ถ้าใส่วันที่ชำระเงินมา ให้สถานะ Shipment นั้นเป็นสถานะ เสร็จสิ้น (COMPLETED)
  if (validatedData.paymentDate) {
    newStatus = "COMPLETED";
  }

  // Validate transitions
  if (newStatus && newStatus !== prevStatus) {
    const validTransitions: Record<string, string[]> = {
      PENDING: ["IN_TRANSIT", "COMPLETED", "CANCELLED"],
      IN_TRANSIT: ["DELIVERED", "COMPLETED", "CANCELLED"],
      DELIVERED: ["COMPLETED", "CANCELLED"],
      COMPLETED: ["CANCELLED"],
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
    ...(newStatus && { status: newStatus }),
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
    ...(validatedData.paymentDate !== undefined && {
      paymentDate: validatedData.paymentDate ? new Date(validatedData.paymentDate) : null,
    }),
    ...(validatedData.dueDate !== undefined && {
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
    }),
    ...(validatedData.salesOrderNumber !== undefined && {
      salesOrderNumber: validatedData.salesOrderNumber,
    }),
    ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
    ...(validatedData.shippingDiscount !== undefined && { shippingDiscount: validatedData.shippingDiscount }),
    ...(validatedData.billDiscount !== undefined && { billDiscount: validatedData.billDiscount }),
    ...(validatedData.items !== undefined && { items: validatedData.items }),
  };

  // ถ้าเปลี่ยนเป็น DELIVERED และไม่มี actualDate → ใช้เวลาปัจจุบัน
  if (newStatus === "DELIVERED" && !updatePayload.actualDate) {
    updatePayload.actualDate = new Date();
  }

  await db.$transaction(async (tx) => {
    // 1. อัพเดท Shipment record
    await ShipmentRepository.updateShipment(shipmentId, updatePayload, tx);

    // 2. หักสต็อกเมื่อเริ่มจัดส่ง (เปลี่ยนจาก PENDING ไป IN_TRANSIT หรือข้ามไป COMPLETED)
    if (prevStatus === "PENDING" && (newStatus === "IN_TRANSIT" || newStatus === "COMPLETED")) {
      // หักสต็อกตามจำนวนที่จัดส่งในรอบนี้ (FIFO)
      await confirmStockDeductionForShipmentUseCase(shipmentId, tx);
    }

    // อัพเดทสถานะการจัดส่งของ Sale เมื่อสถานะ Shipment เปลี่ยนไปในทางที่ก้าวหน้าขึ้น
    if (newStatus === "IN_TRANSIT" || newStatus === "DELIVERED" || newStatus === "COMPLETED") {
      // ตรวจสอบว่าทุก SaleItem ถูก ship ครบแล้วหรือยัง
      const isFullyDelivered = await ShipmentRepository.isFullyDelivered(sale.id, tx);

      let newSaleDeliveryStatus = sale.status;
      if (sale.status !== "COMPLETED") {
        if (isFullyDelivered) {
          newSaleDeliveryStatus = "DELIVERY_COMPLETED";
        } else if (newStatus === "IN_TRANSIT" || newStatus === "DELIVERED" || newStatus === "COMPLETED") {
          newSaleDeliveryStatus = "PARTIALLY_DELIVERED";
        }
      }

      if (newSaleDeliveryStatus !== sale.status) {
        await tx.sale.update({
          where: { id: sale.id },
          data: {
            status: newSaleDeliveryStatus as any,
            // ตั้ง deliveryDate ของ Sale เมื่อส่งครบ
            ...(isFullyDelivered && {
              deliveryDate: updatePayload.actualDate ?? updatePayload.scheduledDate ?? new Date(),
            }),
          },
        });
      }
    }

    // 3. เมื่อ DELIVERED: บันทึก actualDate เท่านั้น (ไม่ต้องหักสต็อกซ้ำ ทำไปแล้วที่ IN_TRANSIT)
    // Sale.status ไม่ต้องเปลี่ยนแปลงเพิ่มเติม

    // 4. เมื่อ CANCELLED จาก IN_TRANSIT, DELIVERED หรือ COMPLETED: คืนสต็อก (reverse)
    if (
      newStatus === "CANCELLED" &&
      (prevStatus === "IN_TRANSIT" || prevStatus === "DELIVERED" || prevStatus === "COMPLETED")
    ) {
      // คืน reservedQuantity และ physicalBalance ต่อสินค้าแต่ละรายการในรอบนี้
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
      const hasAnyActive = await tx.shipment.count({
        where: { saleId: sale.id, status: { in: ["IN_TRANSIT", "DELIVERED", "COMPLETED"] } },
      });

      let newSaleStatus: string;
      if (isStillFullyDelivered) {
        newSaleStatus = "DELIVERY_COMPLETED";
      } else if (hasAnyActive > 0) {
        newSaleStatus = "PARTIALLY_DELIVERED";
      } else {
        newSaleStatus = "AWAITING_DELIVERY";
      }

      await tx.sale.update({
        where: { id: sale.id },
        data: { status: newSaleStatus as any },
      });
    }

    // 5. ตรวจสอบ paymentDate ครบทุก Shipment → เปลี่ยน Sale.status เป็น COMPLETED
    // ทำงานเมื่อมีการอัพเดท paymentDate หรือเปลี่ยนสถานะเป็น COMPLETED
    if (validatedData.paymentDate !== undefined || newStatus === "COMPLETED") {
      const currentSaleForPayment = await tx.sale.findUnique({
        where: { id: sale.id },
        select: { status: true },
      });

      // เปลี่ยนเป็น COMPLETED ได้เฉพาะเมื่อส่งครบทุกชิ้นแล้วเท่านั้น (DELIVERY_COMPLETED)
      // ถ้าสถานะเป็น PARTIALLY_DELIVERED หรืออื่น ๆ แปลว่ายังมีของค้างส่ง ห้าม promote เป็น COMPLETED
      const checkableStatuses = [
        "DELIVERY_COMPLETED",
      ];

      if (
        currentSaleForPayment &&
        checkableStatuses.includes(currentSaleForPayment.status)
      ) {
        // ดึง Shipment ทั้งหมดของ Sale ที่ไม่ถูก CANCELLED
        const allActiveShipments = await tx.shipment.findMany({
          where: { saleId: sale.id, status: { not: "CANCELLED" } },
          select: { id: true, status: true, paymentDate: true },
        });

        // ตรวจสอบว่ามี Shipment อย่างน้อย 1 รายการ และทุกรายการมีสถานะเป็น COMPLETED
        const hasShipments = allActiveShipments.length > 0;
        const allCompleted = allActiveShipments.every(
          (s) => s.status === "COMPLETED" || s.paymentDate !== null, // Fallback check paymentDate
        );

        if (hasShipments && allCompleted) {
          // หา paymentDate ล่าสุดสำหรับบันทึกลง Sale
          const latestPaymentDate = allActiveShipments.reduce(
            (latest, s) =>
              s.paymentDate && (!latest || s.paymentDate > latest)
                ? s.paymentDate
                : latest,
            null as Date | null,
          );

          await tx.sale.update({
            where: { id: sale.id },
            data: {
              status: "COMPLETED",
              ...(latestPaymentDate && { paymentDate: latestPaymentDate }),
            },
          });

          // คืนวงเงินเครดิตเมื่อออเดอร์เสร็จสิ้น (ได้รับชำระเงินครบทุกยอด)
          await restoreCreditLimit(sale.id, tx);

        }
      }
    }
  });
  
  const updatedShipment = await ShipmentRepository.getShipmentById(shipmentId);

  // คำนวณแต้มและงบส่งเสริมการขายที่ได้รับ เมื่อออเดอร์เสร็จสิ้นสมบูรณ์
  if (updatedShipment?.sale?.status === "COMPLETED") {
    try {
      await finalizePointsForSale(updatedShipment.sale.id);
      await finalizePromotionalBudgetForSale(updatedShipment.sale.id);
    } catch (error) {
      console.error("Error finalizing sale points or budget:", error);
    }
  }

  return updatedShipment;
}
