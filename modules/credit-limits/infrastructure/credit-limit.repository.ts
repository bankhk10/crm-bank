import { db } from "@/lib/db";
import type { Prisma } from "@/lib/db";

export async function findCreditLimitById(id: string) {
  return db.creditLimit.findFirst({
    where: { id, deletedAt: null },
    include: {
      customer: {
        include: {
          promotionalBudgets: true,
        },
      },
    },
  });
}

export async function getExistingCreditLimitForUpdate(id: string) {
  return db.creditLimit.findUnique({
    where: { id },
    include: {
      customer: {
        include: {
          promotionalBudgets: true,
        },
      },
    },
  });
}

export async function createCreditLimit(
  data: Prisma.CreditLimitUncheckedCreateInput,
) {
  return db.creditLimit.create({
    data,
    include: {
      customer: true,
    },
  });
}

export async function updateCreditLimit(
  id: string,
  data: Prisma.CreditLimitUpdateInput,
) {
  return db.creditLimit.update({
    where: { id },
    data,
    include: {
      customer: true,
    },
  });
}

export async function deleteCreditLimit(id: string) {
  return db.creditLimit.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function upsertPromotionalBudget(
  customerId: string,
  year: number,
  salesPromotionLimit: number
) {
  const existing = await db.promotionalBudget.findFirst({
    where: { customerId, year, deletedAt: null },
  });

  if (!existing) {
    return db.promotionalBudget.create({
      data: {
        customerId,
        year,
        salesPromotionLimit,
        details: {
          create: {
            type: "SALES_PROMOTION",
            receivedAmount: salesPromotionLimit,
            description: `ตั้งวงเงินงบส่งเสริมปี ${year}`,
          },
        },
      },
    });
  }

  const delta = Number(salesPromotionLimit) - Number(existing.salesPromotionLimit);
  if (delta !== 0) {
    return db.promotionalBudget.update({
      where: { id: existing.id },
      data: {
        salesPromotionLimit,
        details: {
          create: {
            type: "SALES_PROMOTION",
            receivedAmount: delta > 0 ? delta : null,
            usedAmount: delta < 0 ? Math.abs(delta) : null,
            description: delta > 0 
              ? `เพิ่มวงเงินงบส่งเสริม ${delta.toLocaleString()} บาท` 
              : `ลดวงเงินงบส่งเสริม ${Math.abs(delta).toLocaleString()} บาท`,
          },
        },
      },
    });
  }

  return existing;
}
