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
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          const prismaErr = error as Prisma.PrismaClientKnownRequestError;
          if (prismaErr.code === "P2002") {
            continue;
          }
        }
        throw error;
      }
    }

    // Update global employee summary
    await PointsRepository.upsertSummary(sale.employeeId, saleTotalPoints, tx);

    return saleTotalPoints;
  });
}

/**
 * Use Case: Revert points for a sale (e.g. when sale is edited and requires re-approval).
 * Deducts points from employee summary and deletes history.
 */
export async function revertPointsForSaleUseCase(saleId: string, tx?: Prisma.TransactionClient) {
  const dbClient = tx || db;
  
  // 1. Check if points exist
  const hasHistory = await PointsRepository.hasHistoryForSale(saleId, dbClient);
  if (!hasHistory) return;

  // 2. Get total points awarded for this sale
  const totalPoints = await PointsRepository.getPointsSumForSale(saleId, dbClient);
  
  // 3. Get the employee ID for this sale
  const sale = await dbClient.sale.findUnique({
    where: { id: saleId },
    select: { employeeId: true }
  });
  
  if (!sale) return;

  // 4. Decrement summary (pass negative value to increment)
  await PointsRepository.upsertSummary(sale.employeeId, -totalPoints, dbClient);
  
  // 5. Delete history records
  await PointsRepository.deleteHistoryBySaleId(saleId, dbClient);
}
