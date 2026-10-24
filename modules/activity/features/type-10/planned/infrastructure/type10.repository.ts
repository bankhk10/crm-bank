import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type { PrismaTransaction } from "@/modules/activity/types/strategy.interface";
import type { Type10SoldProductItem } from "../../shared/types";

/**
 * Finds Type 10 plan and all dedicated relational data (targets, products, results)
 * with backward compatibility fallback.
 */
export async function findType10ByPlanId(
  activityPlanId: string,
  tx?: PrismaTransaction,
) {
  const db = tx || prisma;
  return (db as any).activityPlan.findUnique({
    where: { id: activityPlanId },
    include: {
      type10Targets: {
        include: {
          demoPlot: true,
          showcaseProduct: true,
          products: {
            include: { product: true },
            orderBy: { createdAt: "asc" },
          },
          result: true,
        },
        orderBy: { createdAt: "asc" },
      },
      type10Products: {
        include: { product: true },
        orderBy: { createdAt: "asc" },
      },
      type10Results: {
        orderBy: { createdAt: "asc" },
      },
      // Backward compatibility fallback
      demoPlotVisits: {
        where: {
          OR: [
            { workTypeCode: "TYPE_10" },
            { workTypeCode: null },
          ],
        },
        include: {
          demoPlot: true,
        },
      },
      products: {
        where: {
          OR: [
            { workTypeCode: "TYPE_10" },
            { workTypeCode: null },
          ],
        },
        include: {
          product: true,
        },
      },
    },
  });
}

/**
 * Backward compatibility: Saves sold products for Type 10 Field Day actual outcome
 * into activity_result_sale_items.
 */
export async function saveType10ActualSaleItems(
  tx: PrismaTransaction,
  activityResultId: string,
  items: Type10SoldProductItem[],
) {
  await (tx as any).activityResultSaleItem.deleteMany({
    where: {
      activityResultId,
      workTypeCode: "TYPE_10",
    },
  });

  if (items && items.length > 0) {
    const validItems = items.filter(
      (item) => item && (item.productName || item.productId),
    );

    if (validItems.length > 0) {
      await (tx as any).activityResultSaleItem.createMany({
        data: validItems.map((item) => {
          const qty =
            item.actualQty != null && item.actualQty !== "" && !isNaN(Number(item.actualQty))
              ? Number(item.actualQty)
              : item.quantity != null && item.quantity !== "" && !isNaN(Number(item.quantity))
                ? Number(item.quantity)
                : 0;

          const amount =
            item.actualSales != null && item.actualSales !== "" && !isNaN(Number(item.actualSales))
              ? Number(item.actualSales)
              : item.actualTotal != null && !isNaN(Number(item.actualTotal))
                ? Number(item.actualTotal)
                : item.amount != null && !isNaN(Number(item.amount))
                  ? Number(item.amount)
                  : 0;

          const unitPrice =
            item.unitPrice != null && !isNaN(Number(item.unitPrice))
              ? Number(item.unitPrice)
              : item.pricePerCase != null && !isNaN(Number(item.pricePerCase))
                ? Number(item.pricePerCase)
                : null;

          return {
            activityResultId,
            workTypeCode: "TYPE_10",
            productId: item.productId || null,
            productName: item.productName || null,
            actualQuantity: qty,
            actualAmount: amount,
            unitPrice,
            remarks: item.remarks || item.actualNotes || null,
          };
        }),
      });
    }
  }
}
