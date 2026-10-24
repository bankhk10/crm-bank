import { prisma } from "@/lib/db";
import type { PrismaTransaction } from "@/modules/activity/types/strategy.interface";
import type { Type11StockItem } from "../../shared/types";

/**
 * Finds Type 11 plan and all dedicated relational data (targets, products, results)
 * with backward compatibility fallback.
 */
export async function findType11ByPlanId(
  activityPlanId: string,
  tx?: PrismaTransaction,
) {
  const db = tx || prisma;
  return (db as any).activityPlan.findUnique({
    where: { id: activityPlanId },
    include: {
      type11Targets: {
        include: {
          store: true,
          dealer: true,
          products: {
            include: { product: true },
            orderBy: { createdAt: "asc" },
          },
          result: true,
        },
        orderBy: { createdAt: "asc" },
      },
      type11Products: {
        include: { product: true },
        orderBy: { createdAt: "asc" },
      },
      type11Results: {
        orderBy: { createdAt: "asc" },
      },
      // Backward compatibility fallback
      stores: {
        where: {
          OR: [
            { workTypeCode: "TYPE_11" },
            { workTypeCode: null },
          ],
        },
        include: {
          store: true,
        },
      },
      products: {
        where: {
          OR: [
            { workTypeCode: "TYPE_11" },
            { workTypeCode: null },
          ],
        },
        include: {
          product: true,
        },
      },
      activityResults: {
        include: {
          stockItems: {
            include: {
              store: true,
              product: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Finds Type 11 stores for an activity plan (backward compatibility)
 */
export async function findType11StoresByPlanId(
  activityPlanId: string,
  tx?: PrismaTransaction,
) {
  const db = tx || prisma;
  const dedicatedTargets = await (db as any).activityPlanType11Target.findMany({
    where: { activityPlanId },
    include: {
      store: true,
      dealer: true,
      products: {
        include: { product: true },
        orderBy: { createdAt: "asc" },
      },
      result: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (dedicatedTargets.length > 0) {
    return dedicatedTargets;
  }

  return (db as any).activityPlanStore.findMany({
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
 * (backward compatibility sync to activity_result_stock_items)
 */
export async function saveType11ActualStockItems(
  tx: PrismaTransaction,
  activityResultId: string,
  items: Type11StockItem[],
  defaultNextAction?: string,
) {
  await (tx as any).activityResultStockItem.deleteMany({
    where: { activityResultId },
  });

  const validItems = items.filter((item) => Boolean(item && (item.storeId || item.storeName) && (item.productId || item.productName)));

  if (validItems.length > 0) {
    await (tx as any).activityResultStockItem.createMany({
      data: validItems.map((item) => ({
        activityResultId,
        storeId: item.storeId || null,
        productId: item.productId || null,
        remainingQuantity:
          typeof item.remainingQuantity === "number"
            ? item.remainingQuantity
            : typeof item.remainingStockQty === "number"
              ? item.remainingStockQty
              : typeof item.actualQuantity === "number"
                ? item.actualQuantity
                : parseInt(String(item.remainingQty || "0").replace(/,/g, ""), 10) || 0,
        stockStatus: item.stockStatus || null,
        reorderOpportunity: item.reorderOpportunity || null,
        remarks: item.remarks || null,
        nextAction: (item as any).nextAction || defaultNextAction || null,
      })),
    });
  }
}
