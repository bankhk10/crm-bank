import { prisma } from "@/lib/db";
import type { PrismaTransaction } from "@/modules/activity/types/strategy.interface";
import type { Type9ProductSaleDetail } from "../../shared/types";

export async function findType9ByPlanId(activityPlanId: string, tx?: PrismaTransaction) {
  const db = tx || prisma;
  return (db as any).activityPlan.findUnique({
    where: { id: activityPlanId },
    include: {
      stores: {
        where: {
          OR: [
            { workTypeCode: "TYPE_9" },
            { workTypeCode: "จัดกิจกรรมส่งเสริมการขายหน้าร้าน" },
          ],
        },
        include: { store: true },
      },
      products: {
        where: {
          OR: [
            { workTypeCode: "TYPE_9" },
            { workTypeCode: "จัดกิจกรรมส่งเสริมการขายหน้าร้าน" },
          ],
        },
        include: { product: true },
      },
    },
  });
}

export async function saveType9ActualSales(
  tx: PrismaTransaction,
  resultId: string,
  saleDetails: Type9ProductSaleDetail[] = [],
) {
  await (tx as any).activityResultSaleItem.deleteMany({
    where: {
      activityResultId: resultId,
      workTypeCode: "TYPE_9",
    },
  });

  if (saleDetails.length > 0) {
    await (tx as any).activityResultSaleItem.createMany({
      data: saleDetails.map((item: Type9ProductSaleDetail) => ({
        activityResultId: resultId,
        workTypeCode: "TYPE_9",
        storeId: item.storeId || null,
        productId: item.productId || null,
        productName: item.productName || null,
        actualQuantity: item.actualQuantityCases
          ? Number(item.actualQuantityCases)
          : 0,
        actualUnitPrice: item.pricePerCase ? Number(item.pricePerCase) : null,
        actualTotal: item.actualSales ? Number(item.actualSales) : null,
      })),
    });
  }
}
