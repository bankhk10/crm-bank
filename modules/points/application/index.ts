import { db, Prisma } from "@/lib/db";
import { PointsRepository } from "../infrastructure/points.repository";

/**
 * Use Case: Finalize and save points for a completed sale.
 * Calculates points based on product definition and updates employee summary.
 */
export async function finalizePointsForSaleUseCase(saleId: string) {
  return db.$transaction(async (tx) => {
    const sale = await PointsRepository.getSaleWithPointsData(saleId, tx);

    if (!sale) {
      throw new Error("Sale not found");
    }

    // Check if points already exist for this sale to avoid double counting
    const hasHistory = await PointsRepository.hasHistoryForSale(saleId, tx);
    if (hasHistory) {
      return PointsRepository.getPointsSumForSale(saleId, tx);
    }

    let saleTotalPoints = 0;

    for (const item of sale.items) {
      const pointPerUnit = item.product?.pointPerUnit ?? 0;
      const totalPoints = item.quantity * pointPerUnit;

      try {
        await PointsRepository.createHistory(
          {
            employee: { connect: { id: sale.employeeId } },
            sale: { connect: { id: sale.id } },
            saleItem: { connect: { id: item.id } },
            product: { connect: { id: item.productId } },
            quantity: item.quantity,
            pointPerUnit,
            totalPoints,
          },
          tx,
        );

        saleTotalPoints += totalPoints;
      } catch (error) {
        // Handle race conditions (P2002 Unique constraint)
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          continue;
        }
        throw error;
      }
    }

    // Update global employee summary
    await PointsRepository.upsertSummary(sale.employeeId, saleTotalPoints, tx);

    return saleTotalPoints;
  });
}
