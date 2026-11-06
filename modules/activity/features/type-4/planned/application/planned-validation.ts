import { z } from "zod";
import type {
  Type4CollectItem,
  ValidateType4Options,
  Type4ValidationResult,
} from "../types/planned.types";

export type { ValidateType4Options, Type4ValidationResult };

/**
 * Zod Schema for Type 4 Planned Collect Item
 */
export const type4CollectItemSchema = z
  .object({
    id: z.string().min(1, "Item ID is required"),
    collectType: z.enum(["BILLING", "COLLECT"]).default("COLLECT"),
    storeId: z.string().optional(),
    customerName: z.string().min(1, "กรุณาเลือกร้านค้า / ลูกค้า"),
    collectAmount: z.coerce.number().min(0).default(0),
    detail: z.string().optional(),
    invoiceNo: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.collectType === "COLLECT") {
      const amount = Number(data.collectAmount);
      if (isNaN(amount) || amount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณาระบุจำนวนเงินที่ต้องเก็บ",
          path: ["collectAmount"],
        });
      }
    }
  });

/**
 * Pure validation function for TYPE 4 (Collection / Billing) form items.
 * Validates store selection and required collect amount for COLLECT operations.
 */
export function validateType4FormItems({
  items = [],
  customersList = [],
  selectedWorkTypes = [],
}: ValidateType4Options): Type4ValidationResult {
  const isType4Active =
    selectedWorkTypes.includes("วางบิล / เก็บเงิน") ||
    selectedWorkTypes.includes("TYPE_4");

  if (selectedWorkTypes.length > 0 && !isType4Active) {
    return { isValid: true };
  }

  if (items.length === 0) {
    return {
      isValid: false,
      error: "กรุณาเพิ่มรายการวางบิล / เก็บเงินอย่างน้อย 1 รายการ",
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

    if (item.collectType !== "BILLING") {
      const amount = Number(item.collectAmount);
      if (item.collectAmount == null || isNaN(amount) || amount <= 0) {
        return {
          isValid: false,
          error: `กรุณาระบุจำนวนเงินที่ต้องเก็บ (รายการที่ ${rowNum})`,
        };
      }
    }
  }

  return { isValid: true };
}
