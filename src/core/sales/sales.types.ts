/**
 * Sales Types
 * Type definitions for sales domain
 */

import type { SaleStatus, PaymentTerm } from "@/src/infrastructure/database";

/**
 * Order expiry info result
 */
export interface OrderExpiryInfo {
  isLocked: boolean;
  expiresIn: number | null; // milliseconds until expiry, null if has delivery date
  remainingUpdates: number;
  warningLevel: "none" | "warning" | "critical";
}

/**
 * Delivery date update result
 */
export interface DeliveryDateUpdateResult {
  success: boolean;
  error?: string;
  isFirstDeliveryDate?: boolean;
  newUpdateCount?: number;
}

/**
 * Order check result (for cron jobs)
 */
export interface OrderCheckResult {
  processed: number;
  errors: string[];
}

/**
 * Sale order input for creating a sale
 */
export interface CreateSaleInput {
  customerId: string;
  employeeId: string;
  paymentTerm: PaymentTerm;
  saleDate: Date;
  requestedDeliveryDate?: Date;
  deliveryMethod?: string;
  pickupCompanyId?: string;
  billingAddress?: string;
  shippingAddress?: string;
  useCustomShipping?: boolean;
  notes?: string;
  items: CreateSaleItemInput[];
  createdById: string;
}

/**
 * Sale item input
 */
export interface CreateSaleItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  priceModified?: boolean;
}

/**
 * Sale filter parameters
 */
export interface SalesFilterParams {
  page?: number;
  perPage?: number;
  search?: string;
  status?: SaleStatus | SaleStatus[];
  startDate?: Date | string;
  endDate?: Date | string;
  customerId?: string;
  employeeId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Statuses that prevent modifications
 */
export const IMMUTABLE_STATUSES: SaleStatus[] = [
  "DELIVERED",
  "DELIVERY_COMPLETED",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
  "OVERDUE",
];

/**
 * Credit-based payment terms
 */
export const CREDIT_PAYMENT_TERMS: PaymentTerm[] = [
  "CREDIT_90",
  "CREDIT_OVER_90",
];

/**
 * Check if status is immutable
 */
export function isImmutableStatus(status: SaleStatus): boolean {
  return IMMUTABLE_STATUSES.includes(status);
}

/**
 * Check if payment term is credit-based
 */
export function isCreditPaymentTerm(term: PaymentTerm): boolean {
  return CREDIT_PAYMENT_TERMS.includes(term);
}
