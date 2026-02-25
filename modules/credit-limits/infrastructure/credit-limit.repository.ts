import { db } from "@/lib/db";
import type { Prisma } from "@/lib/db";

export async function findCreditLimitById(id: string) {
  return db.creditLimit.findFirst({
    where: { id, deletedAt: null },
    include: {
      customer: true,
    },
  });
}

export async function getExistingCreditLimitForUpdate(id: string) {
  return db.creditLimit.findUnique({
    where: { id },
    include: { customer: true },
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
