import { z } from "zod";
import type { Type4UnplannedItem } from "../types/unplanned.types";

export interface Type4UnplannedValidationResult {
  isValid: boolean;
  error?: string;
}

export const type4UnplannedItemSchema = z
  .object({
    id: z.string().min(1, "Item ID is required"),
    storeId: z.string().optional(),
    customerName: z.string().min(1, "กรุณาเลือกร้านค้า / ลูกค้า"),
    collectType: z.enum(["BILLING", "COLLECT"]).default("COLLECT"),
    invoiceNo: z.string().optional(),
    targetAmount: z.coerce.number().min(0).default(0),
    receivedAmount: z.coerce.number().min(0).default(0),
    billingStatus: z.string().optional(),
    billingDetail: z.string().optional(),
    collectDetail: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.collectType === "BILLING") {
      const status = data.billingStatus?.trim() || "วางบิลสำเร็จ";
      if (!status) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณาระบุสถานะการวางบิล",
          path: ["billingStatus"],
        });
      }
    } else if (data.collectType === "COLLECT") {
      const rec = Number(data.receivedAmount);
      if (isNaN(rec) || rec < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณาระบุยอดเงินที่เก็บได้จริง",
          path: ["receivedAmount"],
        });
      }
    }
  });

/**
 * Validates Type 4 Unplanned (นอกแผน 2-in-1) items
 */
export function validateType4UnplannedForm(
  items: Type4UnplannedItem[] = [],
  customersList: Array<{ id: string; name: string }> = [],
): Type4UnplannedValidationResult {
  if (items.length === 0) {
    return {
      isValid: false,
      error: "กรุณาเพิ่มรายการวางบิล / เก็บเงินนอกแผนอย่างน้อย 1 รายการ",
    };
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rowNum = i + 1;

    const sId =
      item.storeId ||
      customersList.find((c) => c.name === item.customerName)?.id;

    if (!sId && !item.customerName?.trim()) {
      return {
        isValid: false,
        error: `กรุณาเลือกร้านค้า / ลูกค้า (รายการที่ ${rowNum})`,
      };
    }

    if (item.collectType === "BILLING") {
      const status = item.billingStatus?.trim() || "วางบิลสำเร็จ";
      if (!status) {
        return {
          isValid: false,
          error: `กรุณาเลือกสถานะการวางบิล (รายการที่ ${rowNum})`,
        };
      }
    } else {
      const rec = Number(item.receivedAmount);
      if (item.receivedAmount == null || isNaN(rec) || rec < 0) {
        return {
          isValid: false,
          error: `กรุณาระบุยอดเงินที่เก็บได้จริง (รายการที่ ${rowNum})`,
        };
      }
    }
  }

  return { isValid: true };
}
