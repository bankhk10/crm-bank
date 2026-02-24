import { db } from "@/src/infrastructure/database";

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
  return db.salesTarget.findUnique({
    where: { id },
    include: salesTargetInclude,
  });
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

  return { monthlyTargets, detailedTargets };
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

  return db.salesTarget.create({
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

  return db.salesTarget.update({
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
