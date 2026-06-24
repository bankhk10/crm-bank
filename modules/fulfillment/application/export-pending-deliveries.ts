import { db } from "@/lib/db";

export async function exportPendingDeliveriesUseCase() {
  const sales = await db.sale.findMany({
    where: {
      status: {
        in: [
          "PENDING",
          "APPROVED",
          "AWAITING_PAYMENT",
          "PAID",
          "AWAITING_DELIVERY",
          "PARTIALLY_DELIVERED",
        ],
      },
      deletedAt: null,
      hasPartialDelivery: true,
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
    const sortedShipments = [...sale.shipments].sort(
      (a, b) => b.shipmentNumber - a.shipmentNumber
    );
    const latestSalesOrderNumber =
      sortedShipments.length > 0 && sortedShipments[0].salesOrderNumber
        ? sortedShipments[0].salesOrderNumber
        : "-";

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
        pendingItems.push({
          latestSalesOrderNumber: latestSalesOrderNumber,
          customerName: sale.customer.name,
          productCodeAndName: `${item.product.productCode} - ${item.product.name}`,
          pendingQuantity: pendingQty,
        });
      }
    }
  }

  return pendingItems;
}
