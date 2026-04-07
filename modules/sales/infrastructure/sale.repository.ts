import { Prisma, SaleStatus, PaymentTerm } from "@/lib/db";
import { db } from "@/lib/db";
import { releaseStockUseCase as releaseStock } from "@/modules/products/application";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type ListSalesParams = {
  page?: number;
  perPage?: number;
  search?: string;
  status?: SaleStatus | SaleStatus[];
  customerId?: string;
  employeeId?: string;
  paymentTerm?: PaymentTerm;
  dateFrom?: string;
  dateTo?: string;
  /** Extra where conditions (e.g. from data-scope) */
  extraWhere?: Prisma.SaleWhereInput;
};

// ─────────────────────────────────────────────
// Shared includes
// ─────────────────────────────────────────────

const listIncludes = {
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
      departmentId: true,
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
  saleAddress: true,
} as const;

// ─────────────────────────────────────────────
// Repository Functions (Data Access Layer)
// ─────────────────────────────────────────────

/**
 * Retrieve a paginated list of sales with optional filters.
 */
export async function findSales(params: ListSalesParams) {
  const {
    page = 1,
    perPage = 10,
    search,
    status,
    customerId,
    employeeId,
    paymentTerm,
    dateFrom,
    dateTo,
    extraWhere,
  } = params;

  const where: Prisma.SaleWhereInput = { deletedAt: null, ...extraWhere };

  if (search) {
    where.OR = [
      { saleNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
      {
        customer: {
          customerCode: { contains: search, mode: "insensitive" },
        },
      },
    ];
  }

  if (status) {
    where.status = Array.isArray(status) ? { in: status } : status;
  }

  if (customerId) where.customerId = customerId;
  if (employeeId) where.employeeId = employeeId;
  if (paymentTerm) where.paymentTerm = paymentTerm;

  if (dateFrom || dateTo) {
    where.saleDate = {};
    if (dateFrom) {
      where.saleDate.gte = new Date(dateFrom);
    }
    if (dateTo) {
      const d = new Date(dateTo);
      d.setDate(d.getDate() + 1);
      where.saleDate.lt = d;
    }
  }

  const skip = (page - 1) * perPage;

  const [sales, total] = await Promise.all([
    db.sale.findMany({
      where,
      skip,
      take: perPage,
      include: listIncludes,
      orderBy: { createdAt: "desc" },
    }),
    db.sale.count({ where }),
  ]);

  return { sales, total, page, perPage };
}

/**
 * Retrieve a single sale by ID with full relation data.
 */
export async function findSaleById(id: string) {
  return db.sale.findUnique({
    where: { id, deletedAt: null },
    include: {
      customer: {
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
      },
      employee: true,
      createdBy: true,
      approvedBy: true,
      saleAddress: true,

      items: {
        include: {
          product: {
            include: {
              stockLots: { where: { isUsed: false } },
              stock: true,
            },
          },
        },
      },
      budgetDetails: true,
      statusHistory: {
        include: { changedBy: true },
        orderBy: { changedAt: "desc" },
      },
    },
  });
}

/**
 * Find the last sale number for generating sequential numbers.
 */
export async function findLastSaleNumber() {
  const last = await db.sale.findFirst({
    orderBy: { createdAt: "desc" },
    select: { saleNumber: true },
  });
  return last?.saleNumber ?? null;
}

/**
 * Fetch customer with active credit limit.
 */
export async function findCustomerWithCredit(customerId: string) {
  return db.customer.findUnique({
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
 * Fetch products by IDs, including stock lots.
 */
export async function findProductsByIds(productIds: string[]) {
  return db.product.findMany({
    where: { id: { in: productIds } },
    include: {
      stockLots: { where: { isUsed: false } },
      productABCType: true,
      productGroup: true,
    },
  });
}

/**
 * Find employee with manager for notification.
 */
export async function findEmployeeWithManager(employeeId: string) {
  return db.employee.findUnique({
    where: { id: employeeId },
    include: { manager: true },
  });
}

/**
 * Verify user exists (handle stale sessions).
 */
export async function findUserById(userId: string) {
  return db.user.findUnique({ where: { id: userId } });
}

/**
 * Create a new sale with items and status history.
 */
export async function createSale(data: {
  saleNumber: string;
  customerId: string;
  employeeId: string;
  paymentTerm: string;
  creditDays?: number;
  creditDueDate?: Date | null;
  usePromotionalCredit?: boolean;
  promotionalCreditUsed?: number | null;
  saleDate: Date;
  requestedDeliveryDate?: Date | null;
  deliveryDate?: Date | null;
  deliveryMethod?: string;
  pickupCompanyId?: string | null;
  shippingCompanyId?: string | null;
  billingAddress?: string;
  useCustomShipping?: boolean;
  selectedAddressId?: string | null;
  subtotalAmount: number;
  shippingCost: number;
  otherCosts: number;
  otherCostsDescription?: string;
  totalAmount: number;
  notes?: string;
  createdById: string;
  // Signature fields
  preparedBySignatureDate?: Date | null;
  preparedBySignatureImage?: string | null;
  items: Array<{
    productId: string;
    productCode?: string | null;
    name?: string | null;
    commonName?: string | null;
    unit?: string | null;
    productGroup?: string | null;
    brand?: string | null;
    packageSize?: number | string | null;
    packageSizeUnit?: string | null;
    packageSizePerBox?: number | string | null;
    totalPackageSizePerBox?: number | string | null;
    price?: number | null;
    cartonPrice?: number | null;
    promotionBudget?: number | null;
    pointPerUnit?: number | null;
    productChain?: string | null;

    quantity: number;
    unitPrice: number;
    originalPrice: number;
    priceModified: boolean;
    totalPrice: number;
  }>;
  // SaleAddress Fields
  companyAddressId?: string | null;
  billingCustomerAddressId?: string | null;
  shippingCustomerAddressId?: string | null;
  pickupCompanyAddressId?: string | null;
  shippingCompanyAddressId?: string | null;

  company_name?: string | null;
  company_phone?: string | null;
  address_line?: string | null;
  address_province?: string | null;
  address_district?: string | null;
  address_subdistrict?: string | null;
  address_code?: string | null;
  company_note?: string | null;

  billing_address_line?: string | null;
  billing_province?: string | null;
  billing_district?: string | null;
  billing_subdistrict?: string | null;
  billing_postal_code?: string | null;
  billing_note?: string | null;

  shipping_address_line?: string | null;
  shipping_province?: string | null;
  shipping_district?: string | null;
  shipping_subdistrict?: string | null;
  shipping_postal_code?: string | null;
  shipping_note?: string | null;

  receiving_name?: string | null;
  receiving_phone?: string | null;
  receiving_address_line?: string | null;
  receiving_province?: string | null;
  receiving_district?: string | null;
  receiving_subdistrict?: string | null;
  receiving_postal_code?: string | null;
  receiving_note?: string | null;

  sender_name?: string | null;
  sender_phone?: string | null;
  sender_line?: string | null;
  sender_province?: string | null;
  sender_district?: string | null;
  sender_subdistrict?: string | null;
  sender_postal_code?: string | null;
  sender_note?: string | null;
}) {
  return db.sale.create({
    data: {
      saleNumber: data.saleNumber,
      customerId: data.customerId,
      employeeId: data.employeeId,
      status: "PENDING_APPROVAL",
      paymentTerm: data.paymentTerm as PaymentTerm,
      creditDays: data.creditDays,
      creditDueDate: data.creditDueDate,
      usePromotionalCredit: data.usePromotionalCredit,
      promotionalCreditUsed:
        data.promotionalCreditUsed != null
          ? new Prisma.Decimal(data.promotionalCreditUsed)
          : null,
      saleDate: data.saleDate,
      requestedDeliveryDate: data.requestedDeliveryDate,
      deliveryDate: data.deliveryDate,
      deliveryMethod: data.deliveryMethod,
      pickupCompanyId: data.pickupCompanyId || null,
      shippingCompanyId: data.shippingCompanyId || null,

      useCustomShipping: data.useCustomShipping ?? false,
      selectedAddressId: data.selectedAddressId || null,
      subtotalAmount: new Prisma.Decimal(data.subtotalAmount),
      shippingCost: new Prisma.Decimal(data.shippingCost),
      otherCosts: new Prisma.Decimal(data.otherCosts),
      otherCostsDescription: data.otherCostsDescription,
      totalAmount: new Prisma.Decimal(data.totalAmount),
      notes: data.notes,
      createdById: data.createdById,
      preparedBySignatureDate: data.preparedBySignatureDate,
      preparedBySignatureImage: data.preparedBySignatureImage,
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          productCode: item.productCode,
          name: item.name,
          commonName: item.commonName,
          unit: item.unit,
          productGroup: item.productGroup,
          brand: item.brand,
          packageSize: item.packageSize,
          packageSizeUnit: item.packageSizeUnit,
          packageSizePerBox: item.packageSizePerBox,
          totalPackageSizePerBox: item.totalPackageSizePerBox,
          price: item.price != null ? new Prisma.Decimal(item.price) : null,
          cartonPrice:
            item.cartonPrice != null
              ? new Prisma.Decimal(item.cartonPrice)
              : null,
          promotionBudget:
            item.promotionBudget != null
              ? new Prisma.Decimal(item.promotionBudget)
              : null,
          pointPerUnit: item.pointPerUnit,
          productChain: item.productChain,

          quantity: item.quantity,
          unitPrice: new Prisma.Decimal(item.unitPrice),
          originalPrice: new Prisma.Decimal(item.originalPrice),
          priceModified: item.priceModified,
          totalPrice: new Prisma.Decimal(item.totalPrice),
        })),
      },
      statusHistory: {
        create: {
          status: "PENDING_APPROVAL",
          notes: "Sale created",
          changedById: data.createdById,
        },
      },
      saleAddress: {
        create: {
          companyAddressId: data.companyAddressId,
          billingCustomerAddressId: data.billingCustomerAddressId,
          shippingCustomerAddressId: data.shippingCustomerAddressId,
          pickupCompanyAddressId: data.pickupCompanyAddressId,
          shippingCompanyAddressId: data.shippingCompanyAddressId,

          company_name: data.company_name,
          company_phone: data.company_phone,
          address_line: data.address_line,
          address_province: data.address_province,
          address_district: data.address_district,
          address_subdistrict: data.address_subdistrict,
          address_code: data.address_code,
          company_note: data.company_note,

          billing_address_line: data.billing_address_line,
          billing_province: data.billing_province,
          billing_district: data.billing_district,
          billing_subdistrict: data.billing_subdistrict,
          billing_postal_code: data.billing_postal_code,
          billing_note: data.billing_note,

          shipping_address_line: data.shipping_address_line,
          shipping_province: data.shipping_province,
          shipping_district: data.shipping_district,
          shipping_subdistrict: data.shipping_subdistrict,
          shipping_postal_code: data.shipping_postal_code,
          shipping_note: data.shipping_note,

          receiving_name: data.receiving_name,
          receiving_phone: data.receiving_phone,
          receiving_address_line: data.receiving_address_line,
          receiving_province: data.receiving_province,
          receiving_district: data.receiving_district,
          receiving_subdistrict: data.receiving_subdistrict,
          receiving_postal_code: data.receiving_postal_code,
          receiving_note: data.receiving_note,

          sender_name: data.sender_name,
          sender_phone: data.sender_phone,
          sender_line: data.sender_line,
          sender_province: data.sender_province,
          sender_district: data.sender_district,
          sender_subdistrict: data.sender_subdistrict,
          sender_postal_code: data.sender_postal_code,
          sender_note: data.sender_note,
        },
      },
    },
    include: {
      ...listIncludes,
      saleAddress: true,
    },
  });
}

/**
 * Update an existing sale within a transaction.
 * Handles credit return, stock release, and status transitions.
 */
export async function updateSale(
  id: string,
  data: {
    existingSale: any;
    customerId: string;
    employeeId: string;
    paymentTerm: string;
    creditDays?: number;
    creditDueDate?: Date | null;
    usePromotionalCredit?: boolean;
    promotionalCreditUsed?: number | null;
    deliveryMethod?: string;
    pickupCompanyId?: string | null;
    shippingCompanyId?: string | null;
    saleDate: Date;
    requestedDeliveryDate?: Date | null;
    deliveryDate?: Date | null;
    deliveryUpdateCount: number;
    billingAddress?: string;
    useCustomShipping?: boolean;
    selectedAddressId?: string | null;
    subtotalAmount: number;
    shippingCost: number;
    otherCosts: number;
    otherCostsDescription?: string;
    totalAmount: number;
    notes?: string;
    userId: string;
    needsReapproval: boolean;
    items: Array<{
      productId: string;
      productCode?: string | null;
      name?: string | null;
      commonName?: string | null;
      unit?: string | null;
      productGroup?: string | null;
      brand?: string | null;
      packageSize?: string | null;
      packageSizeUnit?: string | null;
      packageSizePerBox?: string | null;
      totalPackageSizePerBox?: string | null;
      price?: number | null;
      cartonPrice?: number | null;
      promotionBudget?: number | null;
      pointPerUnit?: number | null;
      productChain?: string | null;

      quantity: number;
      unitPrice: number;
      originalPrice: number;
      priceModified: boolean;
      totalPrice: number;
    }>;
    // SaleAddress Fields
    companyAddressId?: string | null;
    billingCustomerAddressId?: string | null;
    shippingCustomerAddressId?: string | null;
    pickupCompanyAddressId?: string | null;
    shippingCompanyAddressId?: string | null;

    company_name?: string | null;
    company_phone?: string | null;
    address_line?: string | null;
    address_province?: string | null;
    address_district?: string | null;
    address_subdistrict?: string | null;
    address_code?: string | null;
    company_note?: string | null;

    billing_address_line?: string | null;
    billing_province?: string | null;
    billing_district?: string | null;
    billing_subdistrict?: string | null;
    billing_postal_code?: string | null;
    billing_note?: string | null;

    shipping_address_line?: string | null;
    shipping_province?: string | null;
    shipping_district?: string | null;
    shipping_subdistrict?: string | null;
    shipping_postal_code?: string | null;
    shipping_note?: string | null;

    receiving_name?: string | null;
    receiving_phone?: string | null;
    receiving_address_line?: string | null;
    receiving_province?: string | null;
    receiving_district?: string | null;
    receiving_subdistrict?: string | null;
    receiving_postal_code?: string | null;
    receiving_note?: string | null;

    sender_name?: string | null;
    sender_phone?: string | null;
    sender_line?: string | null;
    sender_province?: string | null;
    sender_district?: string | null;
    sender_subdistrict?: string | null;
    sender_postal_code?: string | null;
    sender_note?: string | null;
  },
) {
  return db.$transaction(async (tx) => {
    // Return credit limit if sale was approved and used credit
    if (data.needsReapproval && data.existingSale.paymentTerm !== "PREPAID") {
      const creditLimit = await tx.creditLimit.findFirst({
        where: {
          customerId: data.existingSale.customerId,
          status: "ACTIVE",
          deletedAt: null,
        },
      });

      if (creditLimit) {
        await tx.creditLimit.update({
          where: { id: creditLimit.id },
          data: {
            usedAmount: { decrement: data.existingSale.totalAmount },
            availableAmount: { increment: data.existingSale.totalAmount },
          },
        });
      }
    }

    // If reverting to PENDING, release stock
    if (data.needsReapproval) {
      await releaseStock(id, tx);
    }

    return tx.sale.update({
      where: { id },
      data: {
        customerId: data.customerId,
        employeeId: data.employeeId,
        paymentTerm: data.paymentTerm as PaymentTerm,
        creditDays: data.creditDays,
        creditDueDate: data.creditDueDate,
        usePromotionalCredit: data.usePromotionalCredit,
        promotionalCreditUsed:
          data.promotionalCreditUsed != null
            ? new Prisma.Decimal(data.promotionalCreditUsed)
            : null,
        deliveryMethod: data.deliveryMethod,
        pickupCompanyId: data.pickupCompanyId || null,
        shippingCompanyId: data.shippingCompanyId || null,
        saleDate: data.saleDate,
        requestedDeliveryDate: data.requestedDeliveryDate,
        deliveryDate: data.deliveryDate,
        deliveryUpdateCount: data.deliveryUpdateCount,
        useCustomShipping: data.useCustomShipping ?? false,
        selectedAddressId: data.selectedAddressId || null,
        subtotalAmount: new Prisma.Decimal(data.subtotalAmount),
        shippingCost: new Prisma.Decimal(data.shippingCost),
        otherCosts: new Prisma.Decimal(data.otherCosts),
        otherCostsDescription: data.otherCostsDescription,
        totalAmount: new Prisma.Decimal(data.totalAmount),
        notes: data.notes,
        status: data.needsReapproval
          ? "PENDING_APPROVAL"
          : data.existingSale.status,
        items: {
          deleteMany: {},
          create: data.items.map((item) => ({
            productId: item.productId,
            productCode: item.productCode,
            name: item.name,
            commonName: item.commonName,
            unit: item.unit,
            productGroup: item.productGroup,
            brand: item.brand,
            packageSize: item.packageSize,
            packageSizeUnit: item.packageSizeUnit,
            packageSizePerBox: item.packageSizePerBox,
            totalPackageSizePerBox: item.totalPackageSizePerBox,
            price: item.price != null ? new Prisma.Decimal(item.price) : null,
            cartonPrice:
              item.cartonPrice != null
                ? new Prisma.Decimal(item.cartonPrice)
                : null,
            promotionBudget:
              item.promotionBudget != null
                ? new Prisma.Decimal(item.promotionBudget)
                : null,
            pointPerUnit: item.pointPerUnit,
            productChain: item.productChain,

            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(item.unitPrice),
            originalPrice: new Prisma.Decimal(item.originalPrice),
            priceModified: item.priceModified,
            totalPrice: new Prisma.Decimal(item.totalPrice),
          })),
        },
        statusHistory: data.needsReapproval
          ? {
              create: {
                status: "PENDING_APPROVAL",
                notes: "Sale updated - requires re-approval",
                changedById: data.userId,
              },
            }
          : undefined,
        saleAddress: {
          upsert: {
            create: {
              companyAddressId: data.companyAddressId,
              billingCustomerAddressId: data.billingCustomerAddressId,
              shippingCustomerAddressId: data.shippingCustomerAddressId,
              pickupCompanyAddressId: data.pickupCompanyAddressId,
              shippingCompanyAddressId: data.shippingCompanyAddressId,

              company_name: data.company_name,
              company_phone: data.company_phone,
              address_line: data.address_line,
              address_province: data.address_province,
              address_district: data.address_district,
              address_subdistrict: data.address_subdistrict,
              address_code: data.address_code,
              company_note: data.company_note,

              billing_address_line: data.billing_address_line,
              billing_province: data.billing_province,
              billing_district: data.billing_district,
              billing_subdistrict: data.billing_subdistrict,
              billing_postal_code: data.billing_postal_code,
              billing_note: data.billing_note,

              shipping_address_line: data.shipping_address_line,
              shipping_province: data.shipping_province,
              shipping_district: data.shipping_district,
              shipping_subdistrict: data.shipping_subdistrict,
              shipping_postal_code: data.shipping_postal_code,
              shipping_note: data.shipping_note,

              receiving_name: data.receiving_name,
              receiving_phone: data.receiving_phone,
              receiving_address_line: data.receiving_address_line,
              receiving_province: data.receiving_province,
              receiving_district: data.receiving_district,
              receiving_subdistrict: data.receiving_subdistrict,
              receiving_postal_code: data.receiving_postal_code,
              receiving_note: data.receiving_note,

              sender_name: data.sender_name,
              sender_phone: data.sender_phone,
              sender_line: data.sender_line,
              sender_province: data.sender_province,
              sender_district: data.sender_district,
              sender_subdistrict: data.sender_subdistrict,
              sender_postal_code: data.sender_postal_code,
              sender_note: data.sender_note,
            },
            update: {
              companyAddressId: data.companyAddressId,
              billingCustomerAddressId: data.billingCustomerAddressId,
              shippingCustomerAddressId: data.shippingCustomerAddressId,
              pickupCompanyAddressId: data.pickupCompanyAddressId,
              shippingCompanyAddressId: data.shippingCompanyAddressId,

              company_name: data.company_name,
              company_phone: data.company_phone,
              address_line: data.address_line,
              address_province: data.address_province,
              address_district: data.address_district,
              address_subdistrict: data.address_subdistrict,
              address_code: data.address_code,
              company_note: data.company_note,

              billing_address_line: data.billing_address_line,
              billing_province: data.billing_province,
              billing_district: data.billing_district,
              billing_subdistrict: data.billing_subdistrict,
              billing_postal_code: data.billing_postal_code,
              billing_note: data.billing_note,

              shipping_address_line: data.shipping_address_line,
              shipping_province: data.shipping_province,
              shipping_district: data.shipping_district,
              shipping_subdistrict: data.shipping_subdistrict,
              shipping_postal_code: data.shipping_postal_code,
              shipping_note: data.shipping_note,

              receiving_name: data.receiving_name,
              receiving_phone: data.receiving_phone,
              receiving_address_line: data.receiving_address_line,
              receiving_province: data.receiving_province,
              receiving_district: data.receiving_district,
              receiving_subdistrict: data.receiving_subdistrict,
              receiving_postal_code: data.receiving_postal_code,
              receiving_note: data.receiving_note,

              sender_name: data.sender_name,
              sender_phone: data.sender_phone,
              sender_line: data.sender_line,
              sender_province: data.sender_province,
              sender_district: data.sender_district,
              sender_subdistrict: data.sender_subdistrict,
              sender_postal_code: data.sender_postal_code,
              sender_note: data.sender_note,
            },
          },
        },
      },
      include: {
        customer: true,
        employee: true,
        items: { include: { product: true } },
        saleAddress: true,
      },
    });
  });
}

/**
 * Soft-delete a sale, handling credit return and stock release.
 */
export async function softDeleteSale(id: string, userId: string) {
  const sale = await db.sale.findUnique({
    where: { id, deletedAt: null },
    include: { items: true },
  });

  if (!sale) return null;

  await db.$transaction(async (tx) => {
    // Return credit limit if sale was approved and used credit
    if (
      sale.paymentTerm !== "PREPAID" &&
      (sale.status === "APPROVED" ||
        sale.status === "AWAITING_PAYMENT" ||
        sale.status === "AWAITING_DELIVERY" ||
        sale.status === "DELIVERED" ||
        sale.status === "COMPLETED")
    ) {
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
            usedAmount: { decrement: sale.totalAmount },
            availableAmount: { increment: sale.totalAmount },
          },
        });
      }
    }

    // Return stock if sale was approved/allocated
    if (
      sale.status === "APPROVED" ||
      sale.status === "AWAITING_PAYMENT" ||
      sale.status === "AWAITING_DELIVERY"
    ) {
      await releaseStock(id, tx);
    }

    // Soft delete
    await tx.sale.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        statusHistory: {
          create: {
            status: "CANCELLED",
            notes: "Sale deleted",
            changedById: userId,
          },
        },
      },
    });
  });

  return sale;
}
/**
 * Find a single sale by its sequential sale number.
 */
export async function findSaleBySaleNumber(saleNumber: string) {
  return db.sale.findFirst({
    where: { saleNumber, deletedAt: null },
    include: listIncludes,
  });
}

/**
 * Find the last sale record's number.
 */
export async function getLastSale() {
  return db.sale.findFirst({
    orderBy: { createdAt: "desc" },
    select: { saleNumber: true },
  });
}

/**
 * Create a history entry for a sale's status change.
 */
export async function createStatusHistory(
  saleId: string,
  status: SaleStatus,
  changedById: string,
  notes?: string,
  tx?: Prisma.TransactionClient,
) {
  const client = tx || db;
  return client.saleStatusHistory.create({
    data: {
      saleId,
      status,
      notes,
      changedById,
    },
  });
}

/**
 * Get product with its active stock lots.
 */
export async function getProductWithStock(productId: string) {
  return db.product.findUnique({
    where: { id: productId },
    include: {
      stockLots: {
        where: { isUsed: false },
      },
    },
  });
}

/**
 * Verify if a user exists in the database.
 */
export async function findUserExists(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
}
