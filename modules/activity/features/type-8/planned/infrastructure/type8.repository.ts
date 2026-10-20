import { prisma } from "@/lib/db";
import type { PrismaTransaction } from "@/modules/activity/types/strategy.interface";
import type { ProductSaleDetail } from "../../shared/types";

export async function findType8ByPlanId(activityPlanId: string, tx?: PrismaTransaction) {
  const db = tx || prisma;
  return (db as any).activityPlan.findUnique({
    where: { id: activityPlanId },
    include: {
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

  if (saleDetails.length > 0) {
    await (tx as any).activityResultSaleItem.createMany({
      data: saleDetails.map((item: ProductSaleDetail) => ({
        activityResultId: resultId,
        workTypeCode: "TYPE_8",
        productId: item.productId || null,
        productName: item.productName || null,
        actualQuantity: item.actualQty ? Number(item.actualQty) : 0,
        actualUnitPrice: item.unitPrice ? Number(item.unitPrice) : null,
        actualTotal: item.actualSales ? Number(item.actualSales) : null,
        unclosedReason: item.notes || null,
      })),
    });
  }
}
