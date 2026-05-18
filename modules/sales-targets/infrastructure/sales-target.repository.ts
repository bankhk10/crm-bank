import { db } from "@/lib/db";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface FindSalesTargetsParams {
  year: number;
  month?: number;
  employeeId?: string;
  shopId?: string;
  extraWhere?: any;
}

/**
 * Get all available years that have sales targets.
 */
export async function getAvailableYears(): Promise<number[]> {
  const result = await db.salesTarget.findMany({
    select: { year: true },
    distinct: ["year"],
    orderBy: { year: "asc" },
  });
  return result.map((r) => r.year);
}

// ─────────────────────────────────────────────
// Include definitions
// ─────────────────────────────────────────────

const salesTargetFullInclude = {
  employee: {
    select: { id: true, name: true, employeeCode: true, departmentId: true },
  },
  stores: {
    include: {
      customer: {
        select: { id: true, name: true, customerCode: true },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              productCode: true,
              unit: true,
              cartonPrice: true,
            },
          },
        },
      },
    },
  },
} as const;

// ─────────────────────────────────────────────
// Repository Functions
// ─────────────────────────────────────────────

/**
 * Find a single sales target by ID with all relations.
 */
export async function findSalesTargetById(id: string) {
  const target = await db.salesTarget.findUnique({
    where: { id },
    include: salesTargetFullInclude,
  });

  if (!target) return null;

  return {
    ...target,
    stores: target.stores.map((store) => ({
      ...store,
      items: store.items.map((item) => ({
        ...item,
        pricePerBox: Number(item.pricePerBox),
        targetAmount: Number(item.targetAmount),
        product: item.product
          ? {
              ...item.product,
              cartonPrice:
                item.product.cartonPrice != null
                  ? Number(item.product.cartonPrice)
                  : null,
            }
          : null,
      })),
    })),
  };
}

/**
 * Find sales targets with filters (year, month, employee, shop).
 */
export async function findSalesTargets(params: FindSalesTargetsParams) {
  const { year, month, employeeId, shopId, extraWhere } = params;

  const detailedTargets = await db.salesTarget.findMany({
    where: {
      year,
      ...(month ? { month } : {}),
      ...(employeeId ? { employeeId } : {}),
      ...(shopId
        ? {
            stores: {
              some: { customerId: shopId },
            },
          }
        : {}),
      ...(extraWhere || {}),
    },
    include: salesTargetFullInclude,
    orderBy: [{ month: "asc" }, { createdAt: "desc" }],
  });

  return {
    detailedTargets: detailedTargets.map((t) => ({
      ...t,
      stores: t.stores.map((store) => ({
        ...store,
        items: store.items.map((item) => ({
          ...item,
          pricePerBox: Number(item.pricePerBox),
          targetAmount: Number(item.targetAmount),
          product: item.product
            ? {
                ...item.product,
                cartonPrice:
                  item.product.cartonPrice != null
                    ? Number(item.product.cartonPrice)
                    : null,
              }
            : null,
        })),
      })),
    })),
  };
}

/**
 * Find existing sales target for a given year/month/employee.
 */
export async function findExistingSalesTarget(params: {
  year: number;
  month: number;
  employeeId: string;
  excludeId?: string;
}) {
  const { year, month, employeeId, excludeId } = params;

  return db.salesTarget.findFirst({
    where: {
      year,
      month,
      employeeId,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    include: {
      employee: { select: { id: true, name: true, employeeCode: true } },
    },
  });
}

/**
 * Create a new sales target with stores and items.
 */
export async function createSalesTarget(data: {
  year: number;
  month: number;
  employeeId: string;
  createdById: string;
  stores: {
    customerId: string;
    items: {
      productId: string;
      pricePerBox: number;
      qtyPerBox: number;
      targetAmount: number;
    }[];
  }[];
}) {
  const { stores, ...targetData } = data;

  // ดึงข้อมูลภูมิภาคจากร้านค้าแรกในรายการ
  let region: string | null = null;
  if (stores.length > 0) {
    const firstStore = stores[0];
    const customer = await db.customer.findUnique({
      where: { id: firstStore.customerId },
      select: { region: true }
    });
    region = customer?.region ?? null;
  }

  const target = await db.salesTarget.create({
    data: {
      ...targetData,
      region,
      stores: {
        create: stores.map((store) => ({
          customerId: store.customerId,
          items: {
            create: store.items.map((item) => ({
              productId: item.productId,
              pricePerBox: item.pricePerBox,
              qtyPerBox: item.qtyPerBox,
              targetAmount: item.targetAmount,
            })),
          },
        })),
      },
    },
    include: salesTargetFullInclude,
  });

  return {
    ...target,
    stores: target.stores.map((store) => ({
      ...store,
      items: store.items.map((item) => ({
        ...item,
        pricePerBox: Number(item.pricePerBox),
        targetAmount: Number(item.targetAmount),
        product: item.product
          ? {
              ...item.product,
              cartonPrice:
                item.product.cartonPrice != null
                  ? Number(item.product.cartonPrice)
                  : null,
            }
          : null,
      })),
    })),
  };
}

/**
 * Update an existing sales target (replace all stores and items).
 */
export async function updateSalesTarget(
  id: string,
  data: {
    year: number;
    month: number;
    employeeId: string;
    stores: {
      customerId: string;
      items: {
        productId: string;
        pricePerBox: number;
        qtyPerBox: number;
        targetAmount: number;
      }[];
    }[];
  },
) {
  const { stores, ...targetData } = data;

  // Delete existing stores (cascade deletes items)
  await db.salesTargetStore.deleteMany({
    where: { salesTargetId: id },
  });

  // ดึงข้อมูลภูมิภาคจากร้านค้าแรกในรายการ
  let region: string | null = null;
  if (stores.length > 0) {
    const firstStore = stores[0];
    const customer = await db.customer.findUnique({
      where: { id: firstStore.customerId },
      select: { region: true }
    });
    region = customer?.region ?? null;
  }

  const target = await db.salesTarget.update({
    where: { id },
    data: {
      ...targetData,
      region,
      stores: {
        create: stores.map((store) => ({
          customerId: store.customerId,
          items: {
            create: store.items.map((item) => ({
              productId: item.productId,
              pricePerBox: item.pricePerBox,
              qtyPerBox: item.qtyPerBox,
              targetAmount: item.targetAmount,
            })),
          },
        })),
      },
    },
    include: salesTargetFullInclude,
  });

  return {
    ...target,
    stores: target.stores.map((store) => ({
      ...store,
      items: store.items.map((item) => ({
        ...item,
        pricePerBox: Number(item.pricePerBox),
        targetAmount: Number(item.targetAmount),
        product: item.product
          ? {
              ...item.product,
              cartonPrice:
                item.product.cartonPrice != null
                  ? Number(item.product.cartonPrice)
                  : null,
            }
          : null,
      })),
    })),
  };
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

/**
 * Find sales target from previous month (for "Copy from previous month" feature).
 */
export async function findPreviousMonthTarget(params: {
  year: number;
  month: number;
  employeeId: string;
}) {
  const { year, month, employeeId } = params;

  // Calculate previous month
  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear = year - 1;
  }

  return db.salesTarget.findUnique({
    where: {
      year_month_employeeId: {
        year: prevYear,
        month: prevMonth,
        employeeId,
      },
    },
    include: salesTargetFullInclude,
  });
}
