import { prisma } from "@/lib/db";
import type { Type11StockItem } from "../../shared/types";

/**
 * Finds Type 11 stores for an activity plan
 */
export async function findType11StoresByPlanId(activityPlanId: string) {
  return prisma.activityPlanStore.findMany({
    where: {
      activityPlanId,
      workTypeCode: "TYPE_11",
    },
    include: {
      store: true,
    },
  });
}

/**
 * Saves stock items for Type 11 Store Stock Check actual outcome
 */
export async function saveType11ActualStockItems(
  tx: any,
  activityResultId: string,
  items: Type11StockItem[],
  defaultNextAction?: string,
) {
  await tx.activityResultStockItem.deleteMany({
    where: { activityResultId },
  });

  const validItems = items.filter((item) => Boolean(item.storeId && item.productId));

  if (validItems.length > 0) {
    await tx.activityResultStockItem.createMany({
      data: validItems.map((item) => ({
        activityResultId,
        storeId: item.storeId,
        productId: item.productId,
        remainingQuantity:
          typeof item.remainingQuantity === "number"
            ? item.remainingQuantity
            : parseInt(String(item.remainingQty || "0").replace(/,/g, ""), 10) || 0,
        stockStatus: item.stockStatus || null,
        reorderOpportunity: item.reorderOpportunity || null,
        remarks: item.remarks || null,
        nextAction: (item as any).nextAction || defaultNextAction || null,
      })),
    });
  }
}
