import { db, type SaleStatus } from "@/lib/db";
import { format } from "date-fns";

export interface ExportFilterParams {
  startDate?: string;
  endDate?: string;
  status?: SaleStatus | "ALL" | "FORECAST" | "SALES_NOTE" | "INVOICE" | string;
}

function buildStatusWhereClause(status?: string) {
  if (!status || status === "ALL" || status === "FORECAST") {
    return { notIn: ["CANCELLED"] };
  }
  if (status === "SALES_NOTE") {
    // Sales Note event: all sales created in system (not cancelled)
    return { notIn: ["CANCELLED"] };
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

import {
  resolveDocumentType,
  resolveInvoiceDate,
  resolveSalesNoteDate,
  resolveSalesReportingDate,
  type SalesDocumentType,
} from "@/modules/reports/application/sales-reporting-logic";

export {
  resolveDocumentType,
  resolveInvoiceDate,
  resolveSalesNoteDate,
  resolveSalesReportingDate,
  type SalesDocumentType,
};

/**
 * Legacy aliases for backwards compatibility
 */
export function getDataTypeLabel(saleOrStatus: any): "Invoice" | "Sales Note" {
  if (typeof saleOrStatus === "string") {
    return resolveDocumentType({ status: saleOrStatus });
  }
  return resolveDocumentType(saleOrStatus);
}

export function getInvoiceDate(sale: any): Date | null {
  return resolveInvoiceDate(sale);
}

export function getEffectiveDate(sale: any): Date | null {
  return resolveSalesReportingDate(sale);
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
  const isSalesNoteStatus = filters.status === "SALES_NOTE";
  const isAllStatus = !filters.status || filters.status === "ALL";

  const fetchSales = isAllStatus || isSalesNoteStatus || isInvoiceStatus;
  const fetchTargets = isAllStatus || filters.status === "FORECAST";

  let sales: any[] = [];
  let targets: any[] = [];

  if (fetchSales) {
    const where: Record<string, any> = {
      deletedAt: null,
    };

    // For SALES_NOTE status, filter saleDate in database query directly
    if (isSalesNoteStatus && (filters.startDate || filters.endDate)) {
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

    // 1. When status === "INVOICE": Filter strictly by Invoice Date (column "Inv")
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

    // 2. When status === "ALL": Retain any sale having a Sales Note event OR an Invoice event in range
    if (isAllStatus) {
      if (filters.startDate || filters.endDate) {
        sales = sales.filter((sale) => {
          const saleDate = sale.saleDate instanceof Date ? sale.saleDate : (sale.saleDate ? new Date(sale.saleDate) : null);
          const saleDateStr = saleDate ? format(saleDate, "yyyy-MM-dd") : null;
          const hasSalesNoteEvent =
            saleDateStr !== null &&
            (!filters.startDate || saleDateStr >= filters.startDate) &&
            (!filters.endDate || saleDateStr <= filters.endDate);

          const isInvoice = resolveDocumentType(sale) === "Invoice";
          const invDate = isInvoice ? resolveInvoiceDate(sale) : null;
          const invDateStr = invDate ? format(invDate, "yyyy-MM-dd") : null;
          const hasInvoiceEvent =
            invDateStr !== null &&
            (!filters.startDate || invDateStr >= filters.startDate) &&
            (!filters.endDate || invDateStr <= filters.endDate);

          return hasSalesNoteEvent || hasInvoiceEvent;
        });
      }

      // Sort by saleDate descending (or invoiceDate if newer)
      sales.sort((a, b) => {
        const dateA = a.saleDate ? new Date(a.saleDate).getTime() : 0;
        const dateB = b.saleDate ? new Date(b.saleDate).getTime() : 0;
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

  return {
    sales,
    targets,
    filterStatus: filters.status,
    startDate: filters.startDate,
    endDate: filters.endDate,
  };
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


