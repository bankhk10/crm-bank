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
    // Calculate total price and subtotal
    const saleItemIds = validatedData.items.map((i) => i.saleItemId);
    const saleItems = await tx.saleItem.findMany({
      where: { id: { in: saleItemIds } },
      select: { id: true, unitPrice: true, packageSizePerBox: true },
    });
    const priceItemMap = new Map(saleItems.map((si) => [si.id, si]));

    const itemsWithPrice = validatedData.items.map((item) => {
      const si = priceItemMap.get(item.saleItemId);
      const unitPrice = Number(si?.unitPrice ?? 0);
      const packSize = parseFloat(si?.packageSizePerBox?.toString() || "1");
      const multiplier = isNaN(packSize) || packSize <= 0 ? 1 : packSize;

      const totalPrice = unitPrice * multiplier * item.quantity;
      return { ...item, unitPrice, totalPrice };
    });

    const subtotal = itemsWithPrice.reduce((sum, i) => sum + i.totalPrice, 0);
    const shippingDiscount = validatedData.shippingDiscount ?? 0;
    const billDiscount = validatedData.billDiscount ?? 0;
    const totalAmount = Math.max(0, subtotal - shippingDiscount - billDiscount);

    const newShipment = await ShipmentRepository.createShipment(
      saleId,
      {
        scheduledDate: validatedData.scheduledDate
          ? new Date(validatedData.scheduledDate)
          : null,
        paymentDate: validatedData.paymentDate
          ? new Date(validatedData.paymentDate)
          : null,
        dueDate: validatedData.dueDate
          ? new Date(validatedData.dueDate)
          : null,
        salesOrderNumber: validatedData.salesOrderNumber ?? null,
        shippingCompanyId: validatedData.shippingCompanyId ?? null,
        notes: validatedData.notes ?? null,
        shippingDiscount,
        billDiscount,
        deliveryMethod: validatedData.useCustomDeliveryMethod ? validatedData.deliveryMethod ?? null : null,
        pickupCompanyId: validatedData.useCustomDeliveryMethod ? validatedData.pickupCompanyId ?? null : null,
        shippingAddress: validatedData.useCustomDeliveryMethod ? validatedData.shippingAddress ?? null : null,
        createdById: userId,
        items: itemsWithPrice,
        totalAmount,
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

    // 7. ตรวจสอบ paymentDate ครบทุก Shipment → เปลี่ยน Sale.status เป็น COMPLETED
    if (validatedData.paymentDate) {
      const checkableStatuses = [
        "PARTIALLY_DELIVERED",
        "DELIVERY_COMPLETED",
        "AWAITING_DELIVERY",
        "PAID",
        "AWAITING_PAYMENT",
      ];

      const currentSale = await tx.sale.findUnique({
        where: { id: saleId },
        select: { status: true },
      });

      if (currentSale && checkableStatuses.includes(currentSale.status)) {
        const allActiveShipments = await tx.shipment.findMany({
          where: { saleId, status: { not: "CANCELLED" } },
          select: { id: true, paymentDate: true },
        });

        const hasShipments = allActiveShipments.length > 0;
        const allHavePaymentDate = allActiveShipments.every(
          (s) => s.paymentDate !== null,
        );

        if (hasShipments && allHavePaymentDate) {
          const latestPaymentDate = allActiveShipments.reduce(
            (latest, s) =>
              s.paymentDate && (!latest || s.paymentDate > latest)
                ? s.paymentDate
                : latest,
            null as Date | null,
          );

          await tx.sale.update({
            where: { id: saleId },
            data: {
              status: "COMPLETED",
              ...(latestPaymentDate && { paymentDate: latestPaymentDate }),
            },
          });
        }
      }
    }

    return newShipment;
  });

  return shipment;
}
