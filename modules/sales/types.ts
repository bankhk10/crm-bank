import type { SaleStatus, PaymentTerm } from "@/lib/db";

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
