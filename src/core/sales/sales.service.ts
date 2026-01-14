/**
 * Sales Service
 * Business logic for sales operations
 */

import { Prisma } from "@prisma/client";
import * as SalesRepository from "./sales.repository";
import type { SalesQueryFilters, PaginationParams } from "./sales.repository";
import type { SaleFormData } from "@/types/sales";

/**
 * Stock warning for low stock products
 */
export interface StockWarning {
  productId: string;
  productName: string;
  requested: number;
  available: number;
}

/**
 * Create sale input with user context
 */
export interface CreateSaleInput extends SaleFormData {
  createdById: string;
}

/**
 * List sales with filters and pagination
 */
export async function listSales(
  filters: SalesQueryFilters,
  pagination: PaginationParams
) {
  return SalesRepository.findSales(filters, pagination);
}

/**
 * Get sale by ID
 */
export async function getSaleById(id: string) {
  return SalesRepository.findSaleById(id);
}

/**
 * Generate sale number
 */
export function generateSaleNumber(lastNumber?: string | null): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const prefix = `SO${year}${month}`;

  if (!lastNumber || !lastNumber.startsWith(prefix)) {
    return `${prefix}0001`;
  }

  const lastSeq = parseInt(lastNumber.slice(-4));
  const newSeq = String(lastSeq + 1).padStart(4, "0");
  return `${prefix}${newSeq}`;
}

/**
 * Calculate sale totals
 */
export function calculateTotals(
  items: Array<{ quantity: number; unitPrice: number }>,
  shippingCost: number,
  otherCosts: number
) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const total = subtotal - shippingCost - otherCosts;
  return { subtotal, total };
}

/**
 * Validate credit limit for sale
 */
export async function validateCreditLimit(
  customerId: string,
  total: number,
  paymentTerm: string,
  usePromotionalCredit: boolean,
  promotionalCreditUsed: number
): Promise<{ valid: boolean; error?: string; creditInfo?: object }> {
  if (paymentTerm === "PREPAID") {
    return { valid: true };
  }

  const customer = await SalesRepository.getCustomerWithCredit(customerId);

  if (!customer) {
    return { valid: false, error: "Customer not found" };
  }

  const creditLimit = customer.creditLimits[0];
  if (!creditLimit) {
    return {
      valid: false,
      error: "Customer does not have an active credit limit",
    };
  }

  const availableCredit = Number(creditLimit.availableAmount);
  const promotionalCredit = usePromotionalCredit
    ? Number(creditLimit.promoAmount || 0) - Number(promotionalCreditUsed || 0)
    : 0;

  if (total > availableCredit + promotionalCredit) {
    return {
      valid: false,
      error: "Sale amount exceeds available credit limit",
      creditInfo: {
        available: availableCredit,
        promotional: promotionalCredit,
        required: total,
      },
    };
  }

  return { valid: true };
}

/**
 * Check stock availability for items
 */
export async function checkStockAvailability(
  items: Array<{ productId: string; quantity: number }>
): Promise<StockWarning[]> {
  const warnings: StockWarning[] = [];

  for (const item of items) {
    const product = await SalesRepository.getProductWithStock(item.productId);

    if (product) {
      const totalStock = product.stockLots.reduce(
        (sum, lot) => sum + lot.quantity,
        0
      );
      if (totalStock < item.quantity) {
        warnings.push({
          productId: product.id,
          productName: product.name,
          requested: item.quantity,
          available: totalStock,
        });
      }
    }
  }

  return warnings;
}

/**
 * Verify user session is valid
 */
export async function verifyUserSession(
  userId: string
): Promise<{ valid: boolean; error?: string }> {
  const user = await SalesRepository.verifyUserExists(userId);
  if (!user) {
    return {
      valid: false,
      error: "Session expired or invalid. Please sign in again.",
    };
  }
  return { valid: true };
}

/**
 * Create a new sale
 */
export async function createSale(input: CreateSaleInput) {
  const { subtotal, total } = calculateTotals(
    input.items,
    input.shippingCost,
    input.otherCosts
  );

  // Validate credit
  const creditValidation = await validateCreditLimit(
    input.customerId,
    total,
    input.paymentTerm,
    input.usePromotionalCredit || false,
    input.promotionalCreditUsed || 0
  );

  if (!creditValidation.valid) {
    throw new Error(creditValidation.error);
  }

  // Check stock
  const stockWarnings = await checkStockAvailability(input.items);

  // Generate sale number
  const lastSale = await SalesRepository.getLastSale();
  const saleNumber = generateSaleNumber(lastSale?.saleNumber);

  // Prepare sale data
  const saleData: Prisma.SaleCreateInput = {
    saleNumber,
    customer: { connect: { id: input.customerId } },
    employee: { connect: { id: input.employeeId } },
    status: "PENDING",
    paymentTerm: input.paymentTerm,
    creditDays: input.creditDays,
    creditDueDate: input.creditDueDate ? new Date(input.creditDueDate) : null,
    usePromotionalCredit: input.usePromotionalCredit,
    promotionalCreditUsed: input.promotionalCreditUsed
      ? new Prisma.Decimal(input.promotionalCreditUsed)
      : null,
    saleDate: new Date(input.saleDate),
    requestedDeliveryDate: input.requestedDeliveryDate
      ? new Date(input.requestedDeliveryDate)
      : null,
    deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : null,
    deliveryMethod: input.deliveryMethod,
    pickupCompany: input.pickupCompanyId
      ? { connect: { id: input.pickupCompanyId } }
      : undefined,
    billingAddress: input.billingAddress,
    shippingAddress: input.shippingAddress,
    useCustomShipping: input.useCustomShipping ?? false,
    subtotalAmount: new Prisma.Decimal(subtotal),
    shippingCost: new Prisma.Decimal(input.shippingCost),
    otherCosts: new Prisma.Decimal(input.otherCosts),
    otherCostsDescription: input.otherCostsDescription,
    totalAmount: new Prisma.Decimal(total),
    notes: input.notes,
    createdBy: { connect: { id: input.createdById } },
    items: {
      create: input.items.map((item) => {
        const totalPrice = item.quantity * item.unitPrice;
        return {
          product: { connect: { id: item.productId } },
          quantity: item.quantity,
          unitPrice: new Prisma.Decimal(item.unitPrice),
          originalPrice: new Prisma.Decimal(item.originalPrice),
          priceModified: item.priceModified,
          totalPrice: new Prisma.Decimal(totalPrice),
        };
      }),
    },
    statusHistory: {
      create: {
        status: "PENDING",
        notes: "Sale created",
        changedBy: { connect: { id: input.createdById } },
      },
    },
  };

  const sale = await SalesRepository.createSale(saleData);

  return { sale, stockWarnings };
}

/**
 * Apply data access filters based on user permissions
 */
export function applyDataAccessFilters(
  filters: SalesQueryFilters,
  options: {
    isAdmin: boolean;
    dataAccessLevel?: string;
    employeeId?: string;
    departmentId?: string;
    userId: string;
  }
): SalesQueryFilters {
  if (options.isAdmin) {
    return filters;
  }

  switch (options.dataAccessLevel) {
    case "VIEW_OWN":
      if (options.employeeId) {
        return { ...filters, employeeId: options.employeeId };
      }
      return { ...filters, createdById: options.userId };

    case "VIEW_DEPARTMENT":
      if (options.departmentId) {
        return { ...filters, departmentId: options.departmentId };
      }
      break;

    case "VIEW_ALL":
      return filters;

    default:
      if (options.employeeId) {
        return { ...filters, employeeId: options.employeeId };
      }
      return { ...filters, createdById: options.userId };
  }

  return filters;
}
