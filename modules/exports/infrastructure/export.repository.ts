import { db, type SaleStatus } from "@/lib/db";

export interface ExportFilterParams {
  startDate?: string;
  endDate?: string;
  status?: SaleStatus | "ALL" | "FORECAST" | "SALES_NOTE" | "INVOICE" | string;
}

function buildStatusWhereClause(status?: string) {
  if (!status || status === "ALL") {
    return undefined;
  }
  if (status === "FORECAST") {
    return { in: ["PENDING_APPROVAL", "WAITING_FOR_CORRECTION"] };
  }
  if (status === "SALES_NOTE") {
    return { in: ["APPROVED", "AWAITING_DELIVERY", "PARTIALLY_DELIVERED", "PENDING_APPROVAL", "WAITING_FOR_CORRECTION"] };
  }
  if (status === "INVOICE") {
    return { in: ["DELIVERY_COMPLETED", "PAID", "COMPLETED"] };
  }
  return status;
}

/**
 * Fetch sales data formatted for Sales Admin (Fulfillment & Documents focus)
 */
export async function getSalesAdminExportRecords(filters: ExportFilterParams) {
  const where: Record<string, any> = {
    deletedAt: null,
  };

  if (filters.startDate || filters.endDate) {
    where.saleDate = {};
    if (filters.startDate) {
      where.saleDate.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      where.saleDate.lte = end;
    }
  }

  const statusWhere = buildStatusWhereClause(filters.status);
  if (statusWhere) {
    where.status = statusWhere;
  }

  const sales = await db.sale.findMany({
    where,
    orderBy: { saleDate: "desc" },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          customerType: true,
          province: true,
          district: true,
        },
      },
      employee: {
        select: {
          id: true,
          name: true,
          employeeCode: true,
          departmentName: true,
        },
      },
      shippingCompany: {
        select: {
          id: true,
          name: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
      approvedBy: {
        select: {
          id: true,
          name: true,
        },
      },
      items: {
        select: {
          id: true,
          productCode: true,
          name: true,
          quantity: true,
          unit: true,
          unitPrice: true,
          totalPrice: true,
        },
      },
    },
  });

  return sales;
}

/**
 * Fetch sales data formatted for Marketing (Products, Plants, Volumes & Marketing focus)
 */
export async function getSalesMarketingExportRecords(filters: ExportFilterParams) {
  const where: Record<string, any> = {
    deletedAt: null,
  };

  if (filters.startDate || filters.endDate) {
    where.saleDate = {};
    if (filters.startDate) {
      where.saleDate.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      where.saleDate.lte = end;
    }
  }

  const statusWhere = buildStatusWhereClause(filters.status);
  if (statusWhere) {
    where.status = statusWhere;
  }

  const sales = await db.sale.findMany({
    where,
    orderBy: { saleDate: "desc" },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          customerType: true,
          province: true,
          district: true,
        },
      },
      employee: {
        select: {
          id: true,
          name: true,
          employeeCode: true,
        },
      },
      items: {
        select: {
          id: true,
          productCode: true,
          name: true,
          commonName: true,
          unit: true,
          categoryName: true,
          tradeNameGroupName: true,
          productGroupName: true,
          productABCTypeName: true,
          brand: true,
          usedForPlants: true,
          quantity: true,
          unitPrice: true,
          originalPrice: true,
          totalPrice: true,
          promotionBudget: true,
        },
      },
    },
  });

  return sales;
}
