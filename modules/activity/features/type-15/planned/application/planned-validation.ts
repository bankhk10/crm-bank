/**
 * Type 15 Feature: Planned Validation (บูมทีม / คาราวาน)
 */

import { z } from "zod";
import type { Type15BoomItem } from "../../shared/types";
import type { Type15ValidationResult } from "../types/planned.types";

export const type15PlannedItemSchema = z
  .object({
    id: z.string(),
    storeId: z.string().optional(),
    dealerName: z.string().optional(),
    customerName: z.string().optional(),
    isSubDealer: z.boolean().default(false),
    subdealerId: z.string().optional(),
    subdealerName: z.string().optional(),
    isUnregisteredSubdealer: z.boolean().default(false),
    subDealerStore: z.string().optional(),
    village: z.string().optional(),
    objective: z.string().optional(),
    detail: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.isSubDealer) {
      if (!data.storeId || !data.storeId.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณาเลือกร้านค้าตัวแทนจำหน่ายหลัก (Dealer)",
          path: ["storeId"],
        });
      }
    } else {
      if (data.isUnregisteredSubdealer) {
        if (!data.subDealerStore || !data.subDealerStore.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "กรุณาระบุชื่อร้านค้า Subdealer",
            path: ["subDealerStore"],
          });
        }
        if (!data.storeId || !data.storeId.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "กรุณาเลือก Dealer ต้นสังกัดของร้าน Subdealer",
            path: ["storeId"],
          });
        }
      } else {
        if (!data.subdealerId || !data.subdealerId.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "กรุณาเลือกร้านค้า Subdealer จากระบบ",
            path: ["subdealerId"],
          });
        }
      }
    }
  });

export const type15PlannedSchema = z.array(type15PlannedItemSchema).min(1, {
  message: "กรุณาระบุเป้าหมายอย่างน้อย 1 รายการ",
});

export function validateType15Planned(items: Type15BoomItem[]): Type15ValidationResult {
  if (!items || items.length === 0) {
    return {
      isValid: false,
      error: "กรุณาระบุข้อมูลเป้าหมายบูมทีม / คาราวานอย่างน้อย 1 รายการ",
    };
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const indexLabel = items.length > 1 ? `รายการที่ ${i + 1}: ` : "";

    if (!item.isSubDealer) {
      if (!item.storeId || !item.storeId.trim()) {
        return {
          isValid: false,
          error: `${indexLabel}กรุณาเลือกร้านค้าตัวแทนจำหน่ายหลัก (Dealer)`,
        };
      }
    } else {
      if (item.isUnregisteredSubdealer) {
        if (!item.subDealerStore || !item.subDealerStore.trim()) {
          return {
            isValid: false,
            error: `${indexLabel}กรุณาระบุชื่อร้าน Subdealer`,
          };
        }
        if (!item.storeId || !item.storeId.trim()) {
          return {
            isValid: false,
            error: `${indexLabel}กรุณาเลือก Dealer ต้นสังกัดของร้าน Subdealer`,
          };
        }
      } else {
        if (!item.subdealerId || !item.subdealerId.trim()) {
          return {
            isValid: false,
            error: `${indexLabel}กรุณาเลือกร้านค้า Subdealer จากระบบ`,
          };
        }
      }
    }
  }

  return { isValid: true };
}

