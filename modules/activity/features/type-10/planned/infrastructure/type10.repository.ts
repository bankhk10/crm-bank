import { prisma } from "@/lib/db";
import type { Type10SoldProductItem } from "../../shared/types";

/**
 * Finds Type 10 demo plot visits and products for an activity plan
 */
export async function findType10ByPlanId(activityPlanId: string) {
  const [demoPlotVisits, products, plan] = await Promise.all([
    prisma.demoPlotVisit.findMany({
      where: {
        activityPlanId,
        workTypeCode: "TYPE_10",
      },
      include: {
        demoPlot: true,
      },
    }),
    prisma.activityPlanProduct.findMany({
      where: {
        activityPlanId,
        workTypeCode: "TYPE_10",
      },
      include: {
        product: true,
      },
    }),
    prisma.activityPlan.findUnique({
      where: { id: activityPlanId },
      select: {
        targetAttendeesCount: true,
        targetBookingSales: true,
        location: true,
        notes: true,
      },
    }),
  ]);

  return {
    demoPlotVisits,
    products,
    plan,
  };
}

/**
 * Saves sold products for Type 10 Field Day actual outcome
 */
export async function saveType10ActualSaleItems(
  tx: any,
  activityResultId: string,
  items: Type10SoldProductItem[],
) {
  await tx.activityResultSaleItem.deleteMany({
    where: {
      activityResultId,
      workTypeCode: "TYPE_10",
    },
  });

  if (items && items.length > 0) {
    await tx.activityResultSaleItem.createMany({
      data: items.map((item) => ({
        activityResultId,
        workTypeCode: "TYPE_10",
        productId: item.productId || null,
        productName: item.productName || null,
        actualQuantity:
          item.actualQty != null && item.actualQty !== ""
            ? Number(item.actualQty)
            : item.quantity != null && item.quantity !== ""
              ? Number(item.quantity)
              : 0,
        actualAmount:
          item.actualSales != null && item.actualSales !== ""
            ? Number(item.actualSales)
            : 0,
        unitPrice: item.unitPrice != null ? Number(item.unitPrice) : null,
        remarks: item.remarks || null,
      })),
    });
  }
}
