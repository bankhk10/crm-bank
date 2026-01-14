/**
 * Sales Repository
 * Data access layer for sales operations
 */

import { db as prisma } from "@/src/infrastructure/database";
import type {
  Prisma,
  SaleStatus,
  PaymentTerm,
} from "@/src/infrastructure/database";

/**
 * Sales filter parameters
 */
export interface SalesQueryFilters {
  search?: string;
  status?: SaleStatus | SaleStatus[];
  customerId?: string;
  employeeId?: string;
  paymentTerm?: PaymentTerm;
  dateFrom?: Date;
  dateTo?: Date;
  createdById?: string;
  departmentId?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  perPage: number;
}

/**
 * Build where clause for sales query
 */
export function buildSalesWhereClause(
  filters: SalesQueryFilters
): Prisma.SaleWhereInput {
  const where: Prisma.SaleWhereInput = {
    deletedAt: null,
  };

  if (filters.search) {
    where.OR = [
      { saleNumber: { contains: filters.search, mode: "insensitive" } },
      { customer: { name: { contains: filters.search, mode: "insensitive" } } },
      {
        customer: {
          customerCode: { contains: filters.search, mode: "insensitive" },
        },
      },
    ];
  }

  if (filters.status) {
    if (Array.isArray(filters.status)) {
      where.status = { in: filters.status };
    } else {
      where.status = filters.status;
    }
  }

  if (filters.customerId) {
    where.customerId = filters.customerId;
  }

  if (filters.employeeId) {
    where.employeeId = filters.employeeId;
  }

  if (filters.paymentTerm) {
    where.paymentTerm = filters.paymentTerm;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.saleDate = {};
    if (filters.dateFrom) {
      where.saleDate.gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo);
      dateTo.setDate(dateTo.getDate() + 1);
      where.saleDate.lt = dateTo;
    }
  }

  if (filters.createdById) {
    where.createdById = filters.createdById;
  }

  if (filters.departmentId) {
    where.employee = {
      departmentId: filters.departmentId,
    };
  }

  return where;
}

/**
 * Default include for sales queries
 */
const salesInclude = {
  customer: {
    select: {
      id: true,
      name: true,
      customerCode: true,
      phone: true,
      email: true,
    },
  },
  employee: {
    select: {
      id: true,
      name: true,
      employeeCode: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  approvedBy: {
    select: {
      id: true,
      name: true,
      email: true,
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
          price: true,
        },
      },
    },
  },
} as const;

/**
 * Find sales with pagination
 */
export async function findSales(
  filters: SalesQueryFilters,
  pagination: PaginationParams
) {
  const where = buildSalesWhereClause(filters);
  const skip = (pagination.page - 1) * pagination.perPage;
  const take = pagination.perPage;

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      skip,
      take,
      include: salesInclude,
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.sale.count({ where }),
  ]);

  return { sales, total };
}

/**
 * Find sale by ID
 */
export async function findSaleById(id: string) {
  return prisma.sale.findUnique({
    where: { id },
    include: salesInclude,
  });
}

/**
 * Find sale by sale number
 */
export async function findSaleBySaleNumber(saleNumber: string) {
  return prisma.sale.findFirst({
    where: { saleNumber, deletedAt: null },
    include: salesInclude,
  });
}

/**
 * Get last sale for number generation
 */
export async function getLastSale() {
  return prisma.sale.findFirst({
    orderBy: { createdAt: "desc" },
    select: { saleNumber: true },
  });
}

/**
 * Create a new sale
 */
export async function createSale(
  data: Prisma.SaleCreateInput,
  tx?: Prisma.TransactionClient
) {
  const db = tx || prisma;
  return db.sale.create({
    data,
    include: salesInclude,
  });
}

/**
 * Update a sale
 */
export async function updateSale(
  id: string,
  data: Prisma.SaleUpdateInput,
  tx?: Prisma.TransactionClient
) {
  const db = tx || prisma;
  return db.sale.update({
    where: { id },
    data,
    include: salesInclude,
  });
}

/**
 * Create sale status history entry
 */
export async function createStatusHistory(
  saleId: string,
  status: SaleStatus,
  changedById: string,
  notes?: string,
  tx?: Prisma.TransactionClient
) {
  const db = tx || prisma;
  return db.saleStatusHistory.create({
    data: {
      saleId,
      status,
      notes,
      changedById,
    },
  });
}

/**
 * Get customer with credit limit
 */
export async function getCustomerWithCredit(customerId: string) {
  return prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      creditLimits: {
        where: {
          status: "ACTIVE",
          OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

/**
 * Get product with stock lots
 */
export async function getProductWithStock(productId: string) {
  return prisma.product.findUnique({
    where: { id: productId },
    include: {
      stockLots: {
        where: { isUsed: false },
      },
    },
  });
}

/**
 * Verify user exists
 */
export async function verifyUserExists(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
  });
}
