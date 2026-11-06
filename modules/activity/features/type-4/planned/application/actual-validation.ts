import { z } from "zod";
import type { Type4ActualData } from "../types/actual.types";

export interface Type4ActualValidationResult {
  isValid: boolean;
  error?: string;
}

export const type4ActualSchema = z.object({
  orderNo: z.string().optional(),
  receivedAmount: z.string().optional(),
  billingStatus: z.string().optional(),
  billingDetail: z.string().optional(),
  collectDetail: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.any()).optional(),
});

/**
 * Validates actual outcome for Type 4 (Billing / Collection)
 */
export function validateType4Actual(
  data: Partial<Type4ActualData>,
  collectType?: "BILLING" | "COLLECT",
): Type4ActualValidationResult {
  const items = data.items;

  // 1. If items array exists and is not empty, validate each item
  if (items && items.length > 0) {
    for (const item of items) {
      const isBilling =
        item.collectType === "BILLING" ||
        (!item.collectType && collectType === "BILLING");

      if (isBilling) {
        const status =
          item.billingStatus || (items.length === 1 ? data.billingStatus : "");
        if (!status?.trim()) {
          const storeName = item.companyName || item.customer;
          return {
            isValid: false,
            error: storeName
              ? `กรุณาระบุสถานะการวางบิล (${storeName})`
              : "กรุณาระบุสถานะการวางบิล",
          };
        }
      }

      const isCollect =
        item.collectType === "COLLECT" ||
        (!item.collectType && collectType === "COLLECT");

      if (isCollect || item.receivedAmount) {
        if (item.receivedAmount != null && item.receivedAmount.trim() !== "") {
          const sanitized = item.receivedAmount.replace(/,/g, "");
          const amt = Number(sanitized);
          if (isNaN(amt) || amt < 0) {
            const storeName = item.companyName || item.customer;
            return {
              isValid: false,
              error: storeName
                ? `กรุณาระบุยอดเงินที่เก็บได้ให้ถูกต้อง (${storeName})`
                : "กรุณาระบุยอดเงินที่เก็บได้ให้ถูกต้อง",
            };
          }
        }
      }
    }

    return { isValid: true };
  }

  // 2. Fallback for single/top-level data when items is not provided
  if (collectType === "BILLING" || data.billingStatus) {
    if (!data.billingStatus?.trim()) {
      return {
        isValid: false,
        error: "กรุณาระบุสถานะการวางบิล",
      };
    }
  }

  if (collectType === "COLLECT" || data.receivedAmount) {
    if (data.receivedAmount != null && data.receivedAmount.trim() !== "") {
      const sanitized = data.receivedAmount.replace(/,/g, "");
      const amt = Number(sanitized);
      if (isNaN(amt) || amt < 0) {
        return {
          isValid: false,
          error: "กรุณาระบุยอดเงินที่เก็บได้ให้ถูกต้อง",
        };
      }
    }
  }

  return { isValid: true };
}
