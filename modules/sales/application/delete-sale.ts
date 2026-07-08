import { db } from "@/lib/db";
import { releaseStockUseCase as releaseStock } from "@/modules/products/application";
import { softDeleteSale } from "../infrastructure/sale.repository";

export async function deleteSaleUseCase(id: string, userId: string) {
  const sale = await db.sale.findUnique({
    where: { id, deletedAt: null },
    include: { items: true },
  });

  if (!sale) return null;

  await db.$transaction(async (tx) => {
    // Return credit limit if sale was approved and used credit
    if (
      sale.paymentTerm !== "PREPAID" &&
      (sale.status === "APPROVED" ||
        sale.status === "AWAITING_DELIVERY" ||
        sale.status === "COMPLETED")
    ) {
      const creditLimit = await tx.creditLimit.findFirst({
        where: {
          customerId: sale.customerId,
          status: "ACTIVE",
          deletedAt: null,
        },
      });

      if (creditLimit) {
        await tx.creditLimit.update({
          where: { id: creditLimit.id },
          data: {
            usedAmount: { decrement: sale.totalAmount },
            availableAmount: { increment: sale.totalAmount },
          },
        });
      }
    }

    // Return stock if sale was approved/allocated
    if (
      sale.status === "APPROVED" ||
      sale.status === "AWAITING_DELIVERY"
    ) {
      await releaseStock(id, tx);
    }

    // Soft delete
    await softDeleteSale(id, userId, tx);
  });

  return sale;
}
