import { Prisma, db } from "@/src/infrastructure/database";

export async function finalizePointsForSale(saleId: string) {
  return db.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({
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

    if (!sale) {
      throw new Error("Sale not found");
    }

    const existingHistory = await tx.employeePointHistory.findFirst({
      where: { saleId },
      select: { id: true },
    });

    if (existingHistory) {
      const aggregate = await tx.employeePointHistory.aggregate({
        where: { saleId },
        _sum: { totalPoints: true },
      });
      return aggregate._sum.totalPoints ?? 0;
    }

    let saleTotalPoints = 0;

    for (const item of sale.items) {
      const pointPerUnit = item.product?.pointPerUnit ?? 0;
      const totalPoints = item.quantity * pointPerUnit;

      try {
        await tx.employeePointHistory.create({
          data: {
            employeeId: sale.employeeId,
            saleId: sale.id,
            saleItemId: item.id,
            productId: item.productId,
            quantity: item.quantity,
            pointPerUnit,
            totalPoints,
          },
        });
        saleTotalPoints += totalPoints;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          continue;
        }
        throw error;
      }
    }

    await tx.employeePointSummary.upsert({
      where: { employeeId: sale.employeeId },
      create: {
        employeeId: sale.employeeId,
        totalPoints: saleTotalPoints,
      },
      update: {
        totalPoints: { increment: saleTotalPoints },
      },
    });

    return saleTotalPoints;
  });
}
