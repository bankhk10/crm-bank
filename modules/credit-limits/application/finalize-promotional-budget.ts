import { db, Prisma } from "@/lib/db";

/**
 * Use Case: Finalize and save promotional budget for a completed sale.
 * Calculates budget earned based on product promotionBudget and updates PromotionalBudget table.
 */
export async function finalizePromotionalBudgetForSaleUseCase(saleId: string) {
  return db.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Fetch sale with items and their promotionBudget snapshot
    const sale = await tx.sale.findUnique({
      where: { id: saleId, deletedAt: null },
      include: {
        items: true,
      },
    });

    if (!sale) {
      throw new Error("Sale not found");
    }

    // 2. Check if budget detail already exists for this sale to avoid double counting
    const existingDetail = await tx.promotionalBudgetDetail.findFirst({
      where: { saleId: sale.id },
    });
    if (existingDetail) {
      return; // Already processed
    }

    let totalEarned = 0;
    const year = sale.saleDate.getFullYear();

    // 3. Calculate total earned from items
    for (const item of sale.items) {
      const promoBudgetPerUnit = item.promotionBudget ? Number(item.promotionBudget) : 0;
      if (promoBudgetPerUnit > 0) {
        totalEarned += item.quantity * promoBudgetPerUnit;
      }
    }

    if (totalEarned <= 0) return;

    // 4. Update the main PromotionalBudget for the customer (earning increases the limit)
    // and record the transaction in PromotionalBudgetDetail

    let activeBudgetId: string;
    const budget = await tx.promotionalBudget.findUnique({
      where: {
        customerId_year: {
          customerId: sale.customerId,
          year,
        },
      },
    });

    if (budget) {
      const updated = await tx.promotionalBudget.update({
        where: { id: budget.id },
        data: {
          salesPromotionLimit: { increment: totalEarned },
        },
      });
      activeBudgetId = updated.id;
    } else {
      const created = await tx.promotionalBudget.create({
        data: {
          customerId: sale.customerId,
          year,
          salesPromotionLimit: totalEarned,
          salesPromotionUsed: 0,
        },
      });
      activeBudgetId = created.id;
    }

    // 5. Create the transaction detail
    await tx.promotionalBudgetDetail.create({
      data: {
        budgetId: activeBudgetId,
        type: "SALES_PROMOTION",
        receivedAmount: totalEarned,
        description: `ได้รับงบส่งเสริมการขายจากยอดขาย ${sale.saleNumber}`,
        saleId: sale.id,
      },
    });

    // 6. Also sync back to the legacy CreditLimit.promoAmount if it exists
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
          promoAmount: { increment: totalEarned },
        },
      });
    }

    return totalEarned;
  });
}
