import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
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

  const validSales = (saleDetails || []).filter(
    (item) => item && typeof item.productId === "string" && item.productId.trim() !== "",
  );

  if (validSales.length > 0) {
    await (tx as any).activityResultSaleItem.createMany({
      data: validSales.map((item: Type9ProductSaleDetail) => {
        const qty = item.actualQuantityCases
          ? Math.max(0, parseInt(String(item.actualQuantityCases), 10) || 0)
          : 0;
        const unitPrice =
          item.pricePerCase != null && !isNaN(Number(item.pricePerCase))
            ? Number(item.pricePerCase)
            : 0;
        const total =
          item.actualSales != null && !isNaN(Number(item.actualSales))
            ? Number(item.actualSales)
            : qty * unitPrice;

        return {
          activityResultId: resultId,
          workTypeCode: "TYPE_9",
          storeId: item.storeId || null,
          productId: item.productId!,
          productName: item.productName || null,
          actualQuantity: qty,
          actualUnitPrice: new Prisma.Decimal(unitPrice),
          actualTotal: new Prisma.Decimal(total),
        };
      }),
    });
  }
}
