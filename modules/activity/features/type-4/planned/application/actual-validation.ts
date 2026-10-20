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
});

/**
 * Validates actual outcome for Type 4 (Billing / Collection)
 */
export function validateType4Actual(
  data: Partial<Type4ActualData>,
  collectType?: "BILLING" | "COLLECT",
): Type4ActualValidationResult {
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
