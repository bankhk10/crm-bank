import { z } from "zod";
import type { FollowupProductItem } from "../types/planned.types";

export interface ValidateType2ActualOptions {
  followupResults: FollowupProductItem[];
  status?: string;
}

export interface Type2ActualValidationResult {
  isValid: boolean;
  error?: string;
}

export const followupProductItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().optional(),
  productName: z.string().min(1, "กรุณาระบุชื่อสินค้า"),
  usageResult: z.enum(["พืชตอบสนองดี", "ลูกค้าพึงพอใจ", "พบปัญหา", ""]).optional(),
  problemDetail: z.string().optional(),
  followupDetail: z.string().optional(),
  isAdditional: z.boolean().optional(),
});

export function validateType2Actual({
  followupResults,
  status = "COMPLETED",
}: ValidateType2ActualOptions): Type2ActualValidationResult {
  // If cancelled or postponed, validation is relaxed
  if (status === "CANCELLED" || status === "POSTPONED") {
    return { isValid: true };
  }

  if (!followupResults || followupResults.length === 0) {
    return {
      isValid: false,
      error: "กรุณาระบุผลการติดตามการใช้สินค้าอย่างน้อย 1 รายการ",
    };
  }

  for (let i = 0; i < followupResults.length; i++) {
    const item = followupResults[i];
    const row = i + 1;
    if (item.usageResult === "พบปัญหา" && !item.problemDetail?.trim()) {
      return {
        isValid: false,
        error: `กรุณาระบุรายละเอียดปัญหาที่พบ สำหรับสินค้า "${item.productName || `รายการที่ ${row}`}"`,
      };
    }
  }

  return { isValid: true };
}
