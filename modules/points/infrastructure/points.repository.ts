import { db, Prisma } from "@/lib/db";

export const PointsRepository = {
  /**
   * Find points history for a specific sale
   */
  async findHistoryBySaleId(saleId: string, tx?: Prisma.TransactionClient) {
    const client = tx || db;
    return client.employeePointHistory.findMany({
      where: { saleId },
    });
  },

  /**
   * Delete points history for a specific sale
   */
  async deleteHistoryBySaleId(saleId: string, tx?: Prisma.TransactionClient) {
    const client = tx || db;
    return client.employeePointHistory.deleteMany({
      where: { saleId },
    });
  },

  /**
   * Check if points have already been processed for this sale
   */
  async hasHistoryForSale(saleId: string, tx?: Prisma.TransactionClient) {
    const client = tx || db;
    const history = await client.employeePointHistory.findFirst({
      where: { saleId },
      select: { id: true },
    });
    return !!history;
  },

  /**
   * Get total points sum for a sale
   */
  async getPointsSumForSale(saleId: string, tx?: Prisma.TransactionClient) {
    const client = tx || db;
    const aggregate = await client.employeePointHistory.aggregate({
      where: { saleId },
      _sum: { totalPoints: true },
    });
    return aggregate._sum.totalPoints ?? 0;
  },

  /**
   * Create a single point history record
   */
  async createHistory(
    data: Prisma.EmployeePointHistoryCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || db;
    return client.employeePointHistory.create({ data });
  },

  /**
   * Upsert employee point summary
   */
  async upsertSummary(
    employeeId: string,
    totalPoints: number,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || db;
    return client.employeePointSummary.upsert({
      where: { employeeId },
      create: {
        employeeId,
        totalPoints,
      },
      update: {
        totalPoints: { increment: totalPoints },
      },
    });
  },

  /**
   * Get sale data needed for points calculation
   */
  async getSaleWithPointsData(saleId: string, tx?: Prisma.TransactionClient) {
    const client = tx || db;
    return client.sale.findUnique({
      where: { id: saleId },
      include: {
        items: {
          include: {
            product: {
              select: { pointPerUnit: true },
            },
          },
        },
      },
    });
  },
};
