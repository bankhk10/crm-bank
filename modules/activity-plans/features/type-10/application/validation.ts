import { z } from "zod";
import type {
  ValidateType10Options,
  Type10ValidationResult,
} from "../types";

export type { ValidateType10Options, Type10ValidationResult };

/**
 * Pure validation function for TYPE 10 (Field Day).
 * Validates selected demo plot and minimum attendees count.
 */
export function validateType10FormItems({
  selectedWorkTypes = [],
  type10DemoPlot = "",
  type10Attendees = 0,
}: ValidateType10Options): Type10ValidationResult {
  const isType10Selected =
    selectedWorkTypes.includes("จัดงาน Field Day") ||
    selectedWorkTypes.includes("TYPE_10");

  if (!isType10Selected) {
    return { isValid: true };
  }

  if (!type10DemoPlot || !type10DemoPlot.trim()) {
    return {
      isValid: false,
      error: "กรุณาเลือกแปลงสาธิตสำหรับการจัดงาน Field Day",
    };
  }

  if (type10Attendees == null || Number(type10Attendees) < 1) {
    return {
      isValid: false,
      error: "เป้าหมายผู้เข้าร่วมงาน Field Day ต้องมีอย่างน้อย 1 คน",
    };
  }

  return { isValid: true };
}

/**
 * Schema สำหรับรายการสินค้าที่ขายได้ในกิจกรรม Field Day (Type 10)
 */
export const type10SoldProductItemSchema = z
  .object({
    id: z.string().optional(),
    isCustomProduct: z.boolean().default(false),
    isCustom: z.boolean().optional(),
    productId: z.string().optional().nullable(),
    productName: z.string().min(1, "กรุณาระบุชื่อสินค้า"),
    productCode: z.string().optional().nullable(),
    quantity: z.union([z.string(), z.number()]).refine((val) => {
      const num =
        typeof val === "number"
          ? val
          : parseFloat(String(val).replace(/,/g, ""));
      return !isNaN(num) && num >= 0;
    }, "จำนวนที่ขายได้ต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0"),
    actualSales: z.union([z.string(), z.number()]).refine((val) => {
      const num =
        typeof val === "number"
          ? val
          : parseFloat(String(val).replace(/,/g, ""));
      return !isNaN(num) && num >= 0;
    }, "ยอดขายจริงต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0"),
    remarks: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (!data.isCustomProduct && !data.isCustom && !data.productId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "กรุณาเลือกสินค้าจากระบบ หรือเลือกกรอกชื่อสินค้าเอง",
        path: ["productId"],
      });
    }
  });

export type Type10SoldProductItem = z.infer<typeof type10SoldProductItemSchema>;
