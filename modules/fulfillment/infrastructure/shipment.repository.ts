import { db, Prisma } from "@/lib/db";

export interface CreateShipmentData {
  scheduledDate?: Date | null;
  shippingCompanyId?: string | null;
  notes?: string | null;
  createdById: string;
  items: Array<{ saleItemId: string; quantity: number }>;
}

export interface UpdateShipmentData {
  status?: "PENDING" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";
  scheduledDate?: Date | null;
  actualDate?: Date | null;
  shippingCompanyId?: string | null;
  notes?: string | null;
}

export const ShipmentRepository = {
  /**
   * สร้าง Shipment ใหม่พร้อม ShipmentItems ใน transaction เดียว
   */
  async createShipment(
    saleId: string,
    data: CreateShipmentData,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || db;

    // หา shipmentNumber ถัดไป (max + 1)
    const lastShipment = await client.shipment.findFirst({
      where: { saleId },
      orderBy: { shipmentNumber: "desc" },
      select: { shipmentNumber: true },
    });
    const shipmentNumber = (lastShipment?.shipmentNumber ?? 0) + 1;

    // ดึง unitPrice จาก SaleItem เพื่อคำนวณราคา
    const saleItemIds = data.items.map((i) => i.saleItemId);
    const saleItems = await client.saleItem.findMany({
      where: { id: { in: saleItemIds } },
      select: { id: true, unitPrice: true },
    });
    const priceMap = new Map(saleItems.map((si) => [si.id, si.unitPrice]));

    // คำนวณราคาแต่ละรายการ
    const itemsWithPrice = data.items.map((item) => {
      const unitPrice = priceMap.get(item.saleItemId) ?? 0;
      const totalPrice =
        typeof unitPrice === "object"
          ? Number(unitPrice) * item.quantity
          : Number(unitPrice) * item.quantity;
      return { ...item, unitPrice: Number(unitPrice), totalPrice };
    });

    // รวมมูลค่าทั้งหมดของรอบส่งนี้
    const totalAmount = itemsWithPrice.reduce((sum, i) => sum + i.totalPrice, 0);

    return client.shipment.create({
      data: {
        saleId,
        shipmentNumber,
        status: "PENDING",
        scheduledDate: data.scheduledDate ?? null,
        shippingCompanyId: data.shippingCompanyId ?? null,
        notes: data.notes ?? null,
        totalAmount,
        createdById: data.createdById,
        items: {
          create: itemsWithPrice.map((item) => ({
            saleItemId: item.saleItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
      },
      include: {
        items: { include: { saleItem: true } },
        shippingCompany: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
  },


  /**
   * ดึง Shipments ทั้งหมดของ Sale พร้อมรายการสินค้า
   */
  async getShipmentsBySaleId(saleId: string) {
    return db.shipment.findMany({
      where: { saleId },
      orderBy: { shipmentNumber: "asc" },
      include: {
        items: {
          include: {
            saleItem: {
              select: {
                id: true,
                productId: true,
                productCode: true,
                name: true,
                unit: true,
                quantity: true,
                unitPrice: true,
                totalPrice: true,
              },
            },
          },
        },
        shippingCompany: { select: { id: true, name: true, phone: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
  },


  /**
   * ดึง Shipment เดี่ยวพร้อมทุก relation
   */
  async getShipmentById(shipmentId: string) {
    return db.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        items: {
          include: {
            saleItem: {
              select: {
                id: true,
                productId: true,
                productCode: true,
                name: true,
                unit: true,
                quantity: true,
                unitPrice: true,
                totalPrice: true,
              },
            },
          },
        },
        shippingCompany: true,
        createdBy: { select: { id: true, name: true } },
        sale: {
          select: {
            id: true,
            saleNumber: true,
            customerId: true,
            status: true,
            paymentTerm: true,
            saleAddress: true,
            customer: { select: { id: true, name: true, customerCode: true } },
          },
        },
      },
    });
  },

  /**
   * อัพเดท Shipment (status, dates, notes)
   */
  async updateShipment(
    shipmentId: string,
    data: UpdateShipmentData,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || db;
    return client.shipment.update({
      where: { id: shipmentId },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.scheduledDate !== undefined && { scheduledDate: data.scheduledDate }),
        ...(data.actualDate !== undefined && { actualDate: data.actualDate }),
        ...(data.shippingCompanyId !== undefined && { shippingCompanyId: data.shippingCompanyId }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        items: { include: { saleItem: true } },
      },
    });
  },

  /**
   * คำนวณจำนวนที่ถูกส่งไปแล้วต่อ SaleItem (รวมจาก DELIVERED shipments เท่านั้น)
   * Returns: Map<saleItemId, totalShippedQty>
   */
  async getShippedQuantityPerSaleItem(
    saleId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Map<string, number>> {
    const client = tx || db;

    const shipmentItems = await client.shipmentItem.findMany({
      where: {
        shipment: {
          saleId,
          status: "DELIVERED",
        },
      },
      select: {
        saleItemId: true,
        quantity: true,
      },
    });

    const result = new Map<string, number>();
    for (const item of shipmentItems) {
      result.set(item.saleItemId, (result.get(item.saleItemId) ?? 0) + item.quantity);
    }
    return result;
  },

  /**
   * คำนวณจำนวนที่ยังค้างส่งต่อ SaleItem (รวม PENDING + IN_TRANSIT + DELIVERED)
   * Returns: Map<saleItemId, totalAllocatedQty>
   */
  async getAllocatedQuantityPerSaleItem(
    saleId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<Map<string, number>> {
    const client = tx || db;

    const shipmentItems = await client.shipmentItem.findMany({
      where: {
        shipment: {
          saleId,
          status: { not: "CANCELLED" },
        },
      },
      select: {
        saleItemId: true,
        quantity: true,
      },
    });

    const result = new Map<string, number>();
    for (const item of shipmentItems) {
      result.set(item.saleItemId, (result.get(item.saleItemId) ?? 0) + item.quantity);
    }
    return result;
  },

  /**
   * ตรวจสอบว่าทุก SaleItem ส่งครบแล้วหรือยัง
   * (เปรียบเทียบ DELIVERED qty vs original qty)
   */
  async isFullyDelivered(saleId: string, tx?: Prisma.TransactionClient): Promise<boolean> {
    const client = tx || db;

    const saleItems = await client.saleItem.findMany({
      where: { saleId },
      select: { id: true, quantity: true },
    });

    const shippedMap = await this.getShippedQuantityPerSaleItem(saleId, tx);

    return saleItems.every(
      (item) => (shippedMap.get(item.id) ?? 0) >= item.quantity,
    );
  },
};
