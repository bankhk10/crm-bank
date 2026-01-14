/**
 * Payment Term Constants
 * Centralized payment term definitions and labels
 */

import type { PaymentTerm } from "@prisma/client";

/**
 * Payment term labels in Thai
 */
export const PAYMENT_TERM_LABELS: Record<PaymentTerm, string> = {
  CREDIT_90: "ส่งสินค้าก่อน (เครดิต 90 วัน)",
  CASH_7: "ชำระเงินสด (เครดิต 7 วัน)",
  PREPAID: "ชำระเงินก่อนส่งสินค้า (โอนเงินก่อนส่งสินค้า)",
  CREDIT_OVER_90: "ส่งสินค้าก่อน (เครดิตมากกว่า 90 วัน)",
};

/**
 * Payment term short labels
 */
export const PAYMENT_TERM_SHORT_LABELS: Record<PaymentTerm, string> = {
  CREDIT_90: "เครดิต 90 วัน",
  CASH_7: "เงินสด 7 วัน",
  PREPAID: "ชำระก่อน",
  CREDIT_OVER_90: "เครดิต >90 วัน",
};

/**
 * Credit days for each payment term
 */
export const PAYMENT_TERM_DAYS: Record<PaymentTerm, number> = {
  CREDIT_90: 90,
  CASH_7: 7,
  PREPAID: 0,
  CREDIT_OVER_90: 120, // Default for over 90, can be customized
};

/**
 * Check if payment term requires prepayment
 */
export function requiresPrepayment(term: PaymentTerm): boolean {
  return term === "PREPAID";
}

/**
 * Check if payment term is credit-based
 */
export function isCreditTerm(term: PaymentTerm): boolean {
  return term === "CREDIT_90" || term === "CREDIT_OVER_90";
}

/**
 * Check if payment term requires admin approval
 */
export function requiresAdminApproval(term: PaymentTerm): boolean {
  return term === "CREDIT_OVER_90";
}

/**
 * Get credit days for a payment term
 */
export function getCreditDays(term: PaymentTerm, customDays?: number): number {
  if (term === "CREDIT_OVER_90" && customDays) {
    return customDays;
  }
  return PAYMENT_TERM_DAYS[term];
}

/**
 * Payment term options for select inputs
 */
export const PAYMENT_TERM_OPTIONS = Object.entries(PAYMENT_TERM_LABELS).map(
  ([value, label]) => ({
    value: value as PaymentTerm,
    label,
  })
);

/**
 * Payment term options excluding admin-only options
 */
export const PAYMENT_TERM_OPTIONS_STANDARD = PAYMENT_TERM_OPTIONS.filter(
  (option) => option.value !== "CREDIT_OVER_90"
);
