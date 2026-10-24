import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type { PrismaTransaction } from "@/modules/activity/types/strategy.interface";
import type { ProductSaleDetail } from "../../shared/types";

/**
 * Find Type 8 plan and all dedicated relational data (targets, products, results)
 */
export async function findType8ByPlanId(activityPlanId: string, tx?: PrismaTransaction) {
  const db = tx || prisma;
  return (db as any).activityPlan.findUnique({
    where: { id: activityPlanId },
    include: {
      type8Targets: {
        include: {
          dealer: true,
          subdealer: true,
          products: {
            include: { product: true },
            orderBy: { createdAt: "asc" },
          },
          result: true,
        },
        orderBy: { createdAt: "asc" },
      },
      type8Products: {
        include: { product: true },
        orderBy: { createdAt: "asc" },
      },
      type8Results: {
        orderBy: { createdAt: "asc" },
      },
      // Backward compatibility fallback
      stores: {
        where: { workTypeCode: "TYPE_8" },
        include: { store: true },
      },
      products: {
        where: {
          OR: [
            { workTypeCode: "TYPE_8" },
            { workTypeCode: "TYPE_8_PROMOTION" },
          ],
        },
        include: { product: true },
      },
    },
  });
}

/**
 * Backward compatibility: Save sale records into activity_result_sale_items
 */
export async function saveType8ActualSales(
  tx: PrismaTransaction,
  resultId: string,
  saleDetails: ProductSaleDetail[] = [],
) {
  await (tx as any).activityResultSaleItem.deleteMany({
    where: {
      activityResultId: resultId,
      workTypeCode: "TYPE_8",
    },
  });

  const validSales = (saleDetails || []).filter(
    (item) => item && typeof item.productId === "string" && item.productId.trim() !== "",
  );

  if (validSales.length > 0) {
    await (tx as any).activityResultSaleItem.createMany({
      data: validSales.map((item: ProductSaleDetail) => {
        const qty = item.actualQty
          ? Math.max(0, parseInt(String(item.actualQty), 10) || 0)
          : 0;
        const unitPrice =
          item.unitPrice != null && !isNaN(Number(item.unitPrice))
            ? Number(item.unitPrice)
            : 0;
        const total =
          item.actualSales != null && !isNaN(Number(item.actualSales))
            ? Number(item.actualSales)
            : qty * unitPrice;

        return {
          activityResultId: resultId,
          workTypeCode: "TYPE_8",
          productId: item.productId!,
          productName: item.productName || null,
          actualQuantity: qty,
          actualUnitPrice: new Prisma.Decimal(unitPrice),
          actualTotal: new Prisma.Decimal(total),
          unclosedReason: item.notes || null,
          isAdditional: Boolean(item.isAdditional),
        };
      }),
    });
  }
}
