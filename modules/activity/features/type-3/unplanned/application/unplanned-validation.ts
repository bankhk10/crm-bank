import { z } from "zod";
import type {
  Type3UnplannedItem,
  Type3UnplannedProductItem,
} from "../types/unplanned.types";

export interface ValidateType3UnplannedOptions {
  items: Type3UnplannedItem[];
}

export interface Type3UnplannedValidationResult {
  isValid: boolean;
  error?: string;
}

export const type3UnplannedProductSchema = z.object({
  id: z.string().min(1),
  productId: z.string().optional(),
  productName: z.string().min(1, "กรุณาเลือกสินค้า"),
  targetQuantity: z.coerce.number().optional().default(1),
  actualQuantity: z.coerce.number().min(0, "จำนวนที่ขายได้ต้องไม่ติดลบ"),
  unitPrice: z.coerce.number().min(0, "ราคาต่อหน่วยต้องไม่ติดลบ"),
  actualTotal: z.coerce.number().min(0),
  unclosedReason: z.string().optional(),
});

export const type3UnplannedItemSchema = z
  .object({
    id: z.string().min(1),
    storeId: z.string().optional(),
    storeName: z.string().optional(),
    isSubDealer: z.boolean().default(false),
    isUnregisteredSubdealer: z.boolean().default(false),
    subdealerId: z.string().optional(),
    subdealerName: z.string().optional(),
    subDealerStore: z.string().optional(),
    dealerName: z.string().optional(),
    notes: z.string().optional(),
    products: z.array(type3UnplannedProductSchema).min(1, "กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ"),
  })
  .superRefine((data, ctx) => {
    if (data.isSubDealer) {
      if (data.isUnregisteredSubdealer) {
        if (!data.subDealerStore?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "กรุณาระบุชื่อร้าน Subdealer",
            path: ["subDealerStore"],
          });
        }
        if (!data.storeId && !data.storeName?.trim() && !data.dealerName?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "กรุณาเลือก Dealer ต้นสังกัด",
            path: ["storeName"],
          });
        }
      } else {
        if (!data.subdealerId && !data.subdealerName?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "กรุณาเลือกร้านค้า Subdealer จากระบบ",
            path: ["subdealerId"],
          });
        }
      }
    } else {
      if (!data.storeId && !data.storeName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณาเลือกร้านค้า Dealer",
          path: ["storeName"],
        });
      }
    }
  });

/**
 * Validates a single Type 3 Unplanned Item
 */
export function validateType3UnplannedItem(
  item: Type3UnplannedItem,
  itemNum = 1,
): Type3UnplannedValidationResult {
  return validateType3UnplannedForm({ items: [item] });
}

/**
 * Validates Type 3 Unplanned (2-in-1) items.
 */
export function validateType3UnplannedForm({
  items = [],
}: ValidateType3UnplannedOptions): Type3UnplannedValidationResult {
  if (items.length === 0) {
    return {
      isValid: false,
      error: "กรุณาเพิ่มรายการร้านค้าและสินค้าที่เสนอขายอย่างน้อย 1 รายการ",
    };
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const itemNum = i + 1;

    if (item.isSubDealer) {
      if (item.isUnregisteredSubdealer) {
        if (!item.subDealerStore?.trim()) {
          return {
            isValid: false,
            error: `กรุณาระบุชื่อร้าน Subdealer (รายการที่ ${itemNum})`,
          };
        }
        if (!item.storeId && !item.storeName?.trim() && !item.dealerName?.trim()) {
          return {
            isValid: false,
            error: `กรุณาเลือก Dealer ต้นสังกัด (รายการที่ ${itemNum})`,
          };
        }
      } else {
        if (!item.subdealerId && !item.subdealerName?.trim()) {
          return {
            isValid: false,
            error: `กรุณาเลือกร้านค้า Subdealer จากระบบ (รายการที่ ${itemNum})`,
          };
        }
      }
    } else {
      if (!item.storeId && !item.storeName?.trim()) {
        return {
          isValid: false,
          error: `กรุณาเลือกร้านค้า Dealer (รายการที่ ${itemNum})`,
        };
      }
    }

    if (!item.products || item.products.length === 0) {
      return {
        isValid: false,
        error: `กรุณาเพิ่มสินค้าที่เสนอขายอย่างน้อย 1 รายการ (ร้านค้าที่ ${itemNum})`,
      };
    }

    for (let pIdx = 0; pIdx < item.products.length; pIdx++) {
      const prod = item.products[pIdx];
      const prodNum = pIdx + 1;
      const suffix = item.products.length > 1 ? `, สินค้าที่ ${prodNum}` : "";

      if (!prod.productName?.trim()) {
        return {
          isValid: false,
          error: `กรุณาเลือกสินค้า (ร้านค้าที่ ${itemNum}${suffix})`,
        };
      }

      const actualQty = Number(prod.actualQuantity ?? 0);
      if (isNaN(actualQty) || actualQty < 0) {
        return {
          isValid: false,
          error: `จำนวนที่ขายได้ต้องไม่ติดลบ (ร้านค้าที่ ${itemNum}${suffix})`,
        };
      }

      if (actualQty === 0 && !prod.unclosedReason?.trim()) {
        return {
          isValid: false,
          error: `กรุณาระบุเหตุผลที่ปิดการขายไม่ได้/ได้ไม่ครบสำหรับ ${prod.productName} (ร้านค้าที่ ${itemNum}${suffix})`,
        };
      }
    }
  }

  return { isValid: true };
}
