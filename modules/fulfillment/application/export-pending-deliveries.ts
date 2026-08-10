import { db } from "@/lib/db";

export async function exportPendingDeliveriesUseCase() {
  const sales = await db.sale.findMany({
    where: {
      status: {
        in: [
          "APPROVED",
          "PAID",
          "AWAITING_DELIVERY",
          "PARTIALLY_DELIVERED",
        ],
      },
      deletedAt: null,
      OR: [
        { hasPartialDelivery: true },
        { status: "APPROVED" },
      ],
    },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
      shipments: {
        where: {
          status: {
            notIn: ["CANCELLED"],
          },
        },
        include: {
          items: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const pendingItems = [];

  for (const sale of sales) {
    for (const item of sale.items) {
      let deliveredQty = 0;
      for (const shipment of sale.shipments) {
        const shipmentItem = shipment.items.find(
          (si: any) => si.saleItemId === item.id
        );
        if (shipmentItem) {
          deliveredQty += shipmentItem.quantity;
        }
      }

      const pendingQty = item.quantity - deliveredQty;

      if (pendingQty > 0) {
        const unitPrice = Number(item.unitPrice) || 0;
        const totalPrice = pendingQty * unitPrice;
        const productCode = item.productCode || item.product?.productCode || "";
        const productName = item.name || item.product?.name || "";
        const unit = item.unit || item.product?.unit || "";

        pendingItems.push({
          orderNumber: sale.saleNumber,
          customerName: sale.customer.name,
          productCode,
          productName,
          pendingQuantity: pendingQty,
          unit,
          unitPrice,
          totalPrice,
        });
      }
    }
  }

  return pendingItems;
}
