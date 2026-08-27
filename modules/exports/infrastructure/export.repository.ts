import { db, type SaleStatus } from "@/lib/db";
import { format } from "date-fns";

export interface ExportFilterParams {
  startDate?: string;
  endDate?: string;
  status?: SaleStatus | "ALL" | "FORECAST" | "SALES_NOTE" | "INVOICE" | string;
}

function buildStatusWhereClause(status?: string) {
  if (!status || status === "ALL" || status === "FORECAST") {
    return undefined;
  }
  if (status === "SALES_NOTE") {
    return { in: ["APPROVED", "AWAITING_DELIVERY", "PARTIALLY_DELIVERED", "PENDING_APPROVAL", "WAITING_FOR_CORRECTION"] };
  }
  if (status === "INVOICE") {
    return { in: ["DELIVERY_COMPLETED", "PAID", "COMPLETED"] };
  }
  return status;
}

export function parseStartAndEndDates(startDateStr?: string, endDateStr?: string) {
  let start: Date | null = null;
  let end: Date | null = null;

  if (startDateStr) {
    const parts = startDateStr.split("-").map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      start = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
    } else {
      start = new Date(startDateStr);
      start.setHours(0, 0, 0, 0);
    }
  }

  if (endDateStr) {
    const parts = endDateStr.split("-").map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      end = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
    } else {
      end = new Date(endDateStr);
      end.setHours(23, 59, 59, 999);
    }
  }

  return { start, end };
}

/**
 * Single Source of Truth for extracting the Invoice / Inv Date from a Sale record.
 * This exact function is used for search filters, repository queries, and Excel column "Inv".
 */
export function getInvoiceDate(sale: any): Date | null {
  if (!sale) return null;
  const deliveryDateRaw =
    sale.actualDeliveryDate ||
    sale.deliveryDate ||
    (sale.shipments && sale.shipments.length > 0
      ? sale.shipments.find((s: any) => s.actualDate || s.scheduledDate)?.actualDate ||
        sale.shipments.find((s: any) => s.actualDate || s.scheduledDate)?.scheduledDate
      : null);

  if (!deliveryDateRaw) return null;
  const d = deliveryDateRaw instanceof Date ? deliveryDateRaw : new Date(deliveryDateRaw);
  return !isNaN(d.getTime()) ? d : null;
}

function getYearMonthPairs(startDateStr?: string, endDateStr?: string) {
  if (!startDateStr && !endDateStr) {
    return null;
  }
  const now = new Date();
  const start = startDateStr ? new Date(startDateStr) : new Date(now.getFullYear(), 0, 1);
  const end = endDateStr ? new Date(endDateStr) : new Date(now.getFullYear(), 11, 31);

  const pairs: { year: number; month: number }[] = [];
  let curYear = start.getFullYear();
  let curMonth = start.getMonth() + 1; // 1-12

  const endYear = end.getFullYear();
  const endMonth = end.getMonth() + 1;

  while (curYear < endYear || (curYear === endYear && curMonth <= endMonth)) {
    pairs.push({ year: curYear, month: curMonth });
    curMonth++;
    if (curMonth > 12) {
      curMonth = 1;
      curYear++;
    }
  }

  return pairs;
}

const itemSelectFields = {
  id: true,
  productCode: true,
  name: true,
  commonName: true,
  unit: true,
  quantity: true,
  unitPrice: true,
  originalPrice: true,
  totalPrice: true,
  productGroupName: true,
  productABCTypeName: true,
  tradeNameGroupName: true,
  categoryName: true,
  brand: true,
  packageSize: true,
  packageSizeUnit: true,
  packageSizePerBox: true,
  totalPackageSizePerBox: true,
  usedForPlants: true,
  promotionBudget: true,
  product: {
    select: {
      id: true,
      packageSize: true,
      packageSizeUnit: true,
      packageSizePerBox: true,
      totalPackageSizePerBox: true,
      commonName: true,
      unit: true,
      category: {
        select: {
          description: true,
          code: true,
        },
      },
      productGroup: {
        select: {
          name: true,
          code: true,
        },
      },
      productABCType: {
        select: {
          name: true,
          code: true,
        },
      },
      tradeNameGroup: {
        select: {
          description: true,
          code: true,
        },
      },
    },
  },
};

const shipmentSelectFields = {
  where: {
    status: { not: "CANCELLED" as const },
  },
  orderBy: {
    createdAt: "desc" as const,
  },
  select: {
    id: true,
    salesOrderNumber: true,
    actualDate: true,
    scheduledDate: true,
    paymentDate: true,
  },
};

const salesTargetInclude = {
  employee: {
    select: {
      id: true,
      name: true,
      nickname: true,
      employeeCode: true,
    },
  },
  stores: {
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
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              productCode: true,
              unit: true,
              brand: true,
              packageSize: true,
              packageSizeUnit: true,
              packageSizePerBox: true,
              totalPackageSizePerBox: true,
              commonName: true,
              category: {
                select: {
                  description: true,
                  code: true,
                },
              },
              productGroup: {
                select: {
                  name: true,
                  code: true,
                },
              },
              productABCType: {
                select: {
                  name: true,
                  code: true,
                },
              },
              tradeNameGroup: {
                select: {
                  description: true,
                  code: true,
                },
              },
            },
          },
        },
      },
    },
  },
};

/**
 * Fetch sales and sales targets data formatted for Sales Admin (Fulfillment & Documents focus)
 */
export async function getSalesAdminExportRecords(filters: ExportFilterParams) {
  const isInvoiceStatus = filters.status === "INVOICE";
  const fetchSales = !filters.status || filters.status === "ALL" || filters.status === "SALES_NOTE" || isInvoiceStatus;
  const fetchTargets = !filters.status || filters.status === "ALL" || filters.status === "FORECAST";

  let sales: any[] = [];
  let targets: any[] = [];

  if (fetchSales) {
    const where: Record<string, any> = {
      deletedAt: null,
    };

    // For non-Invoice statuses, keep the legacy date filtering on saleDate
    if (!isInvoiceStatus && (filters.startDate || filters.endDate)) {
      const { start, end } = parseStartAndEndDates(filters.startDate, filters.endDate);
      where.saleDate = {};
      if (start) {
        where.saleDate.gte = start;
      }
      if (end) {
        where.saleDate.lte = end;
      }
    }

    const statusWhere = buildStatusWhereClause(filters.status);
    if (statusWhere) {
      where.status = statusWhere;
    }

    sales = await db.sale.findMany({
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
            nickname: true,
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
        shipments: shipmentSelectFields,
        items: {
          select: itemSelectFields,
        },
      },
    });

    // When status === "INVOICE", filter strictly by Invoice Date (the date in Excel column "Inv")
    if (isInvoiceStatus) {
      if (filters.startDate || filters.endDate) {
        sales = sales.filter((sale) => {
          const invDate = getInvoiceDate(sale);
          if (!invDate) return false;
          const invDateStr = format(invDate, "yyyy-MM-dd");
          if (filters.startDate && invDateStr < filters.startDate) return false;
          if (filters.endDate && invDateStr > filters.endDate) return false;
          return true;
        });
      }

      // Sort by Invoice Date descending (fallback to saleDate)
      sales.sort((a, b) => {
        const dateA = getInvoiceDate(a)?.getTime() ?? (a.saleDate ? new Date(a.saleDate).getTime() : 0);
        const dateB = getInvoiceDate(b)?.getTime() ?? (b.saleDate ? new Date(b.saleDate).getTime() : 0);
        return dateB - dateA;
      });
    }
  }

  if (fetchTargets) {
    const monthPairs = getYearMonthPairs(filters.startDate, filters.endDate);
    const targetWhere: Record<string, any> = {};
    if (monthPairs && monthPairs.length > 0) {
      targetWhere.OR = monthPairs;
    }
    targets = await db.salesTarget.findMany({
      where: targetWhere,
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: salesTargetInclude,
    });
  }

  return { sales, targets };
}

export async function getProductStockExportRecords() {
  const products = await db.product.findMany({
    where: {
      deletedAt: null,
    },
    include: {
      stock: true,
    },
    orderBy: {
      productCode: "asc",
    },
  });

  return products.map((product) => {
    const physical = product.stock?.physicalBalance ?? 0;
    const reserved = product.stock?.reservedQuantity ?? 0;
    const available = product.stock
      ? product.stock.availableQuantity
      : physical - reserved;

    return {
      productCode: product.productCode,
      productName: product.name,
      unit: product.unit || "-",
      price: product.price ? Number(product.price) : 0,
      cartonPrice: product.cartonPrice ? Number(product.cartonPrice) : 0,
      physicalStock: physical,
      reservedStock: reserved,
      availableStock: available,
    };
  });
}


