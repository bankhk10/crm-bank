import { db } from "@/lib/db";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface FindSalesTargetsParams {
  year: number;
  month?: number;
  employeeId?: string;
  shopId?: string;
}

// ─────────────────────────────────────────────
// Repository Functions (Data Access Layer)
// ─────────────────────────────────────────────

const salesTargetInclude = {
  employee: {
    select: { id: true, name: true, employeeCode: true },
  },
  customer: {
    select: { id: true, name: true, customerCode: true },
  },
  items: {
    include: {
      product: {
        select: { id: true, name: true, productCode: true },
      },
    },
  },
} as const;

/**
 * Find a single sales target by ID with all relations.
 */
export async function findSalesTargetById(id: string) {
  const target = await db.salesTarget.findUnique({
    where: { id },
    include: salesTargetInclude,
  });

  if (!target) return null;

  return {
    ...target,
    items: target.items.map((i) => ({
      ...i,
      amount: Number(i.amount),
    })),
  };
}

/**
 * Find sales targets with filters (year, month, employee, shop).
 */
export async function findSalesTargets(params: FindSalesTargetsParams) {
  const { year, month, employeeId, shopId } = params;

  const [monthlyTargets, detailedTargets] = await Promise.all([
    // Monthly Targets (Legacy/Aggregated)
    db.monthlySalesTarget.findMany({
      where: { year, deletedAt: null },
      orderBy: { month: "asc" },
    }),
    // Detailed Targets
    db.salesTarget.findMany({
      where: {
        year,
        ...(month ? { month } : {}),
        ...(employeeId ? { employeeId } : {}),
        ...(shopId ? { customerId: shopId } : {}),
      },
      include: salesTargetInclude,
      orderBy: [{ month: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  return {
    monthlyTargets: monthlyTargets.map((t) => ({
      ...t,
      targetAmount: Number(t.targetAmount),
    })),
    detailedTargets: detailedTargets.map((t) => ({
      ...t,
      items: t.items.map((i) => ({
        ...i,
        amount: Number(i.amount),
      })),
    })),
  };
}

/**
 * Check if a sales target with the same year, month, employee, and customer already exists.
 * Pass excludeId to exclude the current record when checking during update.
 */
export async function findDuplicateSalesTarget(params: {
  year: number;
  month: number;
  employeeId: string;
  customerId: string;
  excludeId?: string;
}) {
  const { year, month, employeeId, customerId, excludeId } = params;

  return db.salesTarget.findFirst({
    where: {
      year,
      month,
      employeeId,
      customerId,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    include: {
      employee: { select: { id: true, name: true, employeeCode: true } },
      customer: { select: { id: true, name: true, customerCode: true } },
    },
  });
}

/**
 * Create a new sales target with items.
 */
export async function createSalesTarget(data: {
  year: number;
  month: number;
  employeeId: string;
  customerId: string;
  createdById: string;
  items: { productId: string; quantity: number; amount: number }[];
}) {
  const { items, ...targetData } = data;

  const target = await db.salesTarget.create({
    data: {
      ...targetData,
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          amount: item.amount,
        })),
      },
    },
    include: { items: true },
  });

  return {
    ...target,
    items: target.items.map((i) => ({
      ...i,
      amount: Number(i.amount),
    })),
  };
}

/**
 * Update an existing sales target (replace items).
 */
export async function updateSalesTarget(
  id: string,
  data: {
    year: number;
    month: number;
    employeeId: string;
    customerId: string;
    items: { productId: string; quantity: number; amount: number }[];
  },
) {
  const { items, ...targetData } = data;

  // Delete existing items to replace them
  await db.salesTargetItem.deleteMany({
    where: { salesTargetId: id },
  });

  const target = await db.salesTarget.update({
    where: { id },
    data: {
      ...targetData,
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          amount: item.amount,
        })),
      },
    },
    include: { items: true },
  });

  return {
    ...target,
    items: target.items.map((i) => ({
      ...i,
      amount: Number(i.amount),
    })),
  };
}

/**
 * Find a legacy monthly sales target by year and month.
 */
export async function findMonthlySalesTarget(year: number, month: number) {
  return db.monthlySalesTarget.findFirst({
    where: { year, month, deletedAt: null },
  });
}

/**
 * Create or update a legacy monthly sales target.
 */
export async function upsertMonthlySalesTarget(data: {
  id?: string;
  year: number;
  month: number;
  targetAmount: number;
  notes?: string;
  createdById: string;
}) {
  const { id, targetAmount, ...rest } = data;

  if (id) {
    return db.monthlySalesTarget.update({
      where: { id },
      data: {
        targetAmount,
        notes: rest.notes,
      },
    });
  }

  return db.monthlySalesTarget.create({
    data: {
      year: rest.year,
      month: rest.month,
      targetAmount,
      notes: rest.notes,
      createdById: rest.createdById,
    },
  });
}

/**
 * Delete a sales target by ID.
 */
export async function deleteSalesTargetById(id: string) {
  const target = await db.salesTarget.findUnique({ where: { id } });
  if (!target) throw new Error("Target not found");

  await db.salesTarget.delete({ where: { id } });
  return true;
}
