import { z } from "zod";
import type {
  Type3SalesItem,
  ValidateType3Options,
  Type3ValidationResult,
} from "../types/planned.types";

export type { ValidateType3Options, Type3ValidationResult };

/**
 * Zod Schema for Type 3 Planned Product Line
 */
export const type3ProductLineSchema = z.object({
  id: z.string().min(1, "Product Line ID is required"),
  productId: z.string().optional(),
  productName: z.string().min(1, "กรุณาเลือกสินค้าที่ต้องการเสนอขาย"),
  quantity: z.coerce.number().positive("จำนวนสินค้าต้องมากกว่า 0"),
  unitPrice: z.coerce.number().min(0, "ราคาต่อหน่วยต้องไม่ติดลบ").optional(),
  price: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

/**
 * Zod Schema for Type 3 Planned Store Item
 */
export const type3SalesItemSchema = z
  .object({
    id: z.string().min(1, "Item ID is required"),
    storeId: z.string().optional(),
    isSubDealer: z.boolean().default(false),
    isUnregisteredSubdealer: z.boolean().default(false),
    subdealerId: z.string().optional(),
    subdealerName: z.string().optional(),
    subDealerStore: z.string().optional(),
    dealerName: z.string().optional(),
    customerName: z.string().optional(),
    products: z.array(type3ProductLineSchema).optional(),
    notes: z.string().optional(),
    detail: z.string().optional(),
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
        if (!data.storeId && !data.customerName?.trim() && !data.dealerName?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "กรุณาเลือก Dealer ต้นสังกัด",
            path: ["customerName"],
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
      if (!data.storeId && !data.customerName?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณาเลือกร้านค้า Dealer",
          path: ["customerName"],
        });
      }
    }
  });

/**
 * Pure validation function for TYPE 3 (Product Sales Proposal) form items.
 * Validates Dealer/Subdealer store selection and product lines.
 */
export function validateType3FormItems({
  items = [],
  customersList = [],
  selectedWorkTypes = [],
}: ValidateType3Options): Type3ValidationResult {
  const isType3Active =
    selectedWorkTypes.includes("เสนอขายสินค้า") ||
    selectedWorkTypes.includes("TYPE_3");

  if (selectedWorkTypes.length > 0 && !isType3Active) {
    return { isValid: true };
  }

  if (items.length === 0) {
    return {
      isValid: false,
      error: "กรุณาเพิ่มรายการเสนอขายสินค้าอย่างน้อย 1 รายการ",
    };
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rowNum = i + 1;

    if (item.isSubDealer) {
      if (item.isUnregisteredSubdealer) {
        if (!item.subDealerStore?.trim()) {
          return {
            isValid: false,
            error: `กรุณาระบุชื่อร้าน Subdealer (รายการที่ ${rowNum})`,
          };
        }
        const sId =
          item.storeId ||
          customersList.find((c) => c.name === item.customerName || c.name === item.dealerName)?.id;
        if (!sId && !item.customerName?.trim() && !item.dealerName?.trim()) {
          return {
            isValid: false,
            error: `กรุณาเลือก Dealer ต้นสังกัด (รายการที่ ${rowNum})`,
          };
        }
      } else {
        const subId =
          item.subdealerId ||
          customersList.find((c) => c.name === item.subdealerName)?.id;
        if (!subId && !item.subdealerName?.trim()) {
          return {
            isValid: false,
            error: `กรุณาเลือกร้านค้า Subdealer จากระบบ (รายการที่ ${rowNum})`,
          };
        }
      }
    } else {
      const sId =
        item.storeId ||
        customersList.find((c) => c.name === item.customerName)?.id;
      if (!sId && !item.customerName?.trim()) {
        return {
          isValid: false,
          error: `กรุณาเลือกร้านค้า Dealer (รายการที่ ${rowNum})`,
        };
      }
    }

    const prodList =
      item.products && item.products.length > 0
        ? item.products
        : [
            {
              id: "fallback-p",
              productName: item.productName || "",
              quantity: item.quantity != null ? item.quantity : 1,
            },
          ];

    if (prodList.length === 0) {
      return {
        isValid: false,
        error: `กรุณาเพิ่มสินค้าที่ต้องการเสนอขาย (รายการที่ ${rowNum})`,
      };
    }

    for (let pIdx = 0; pIdx < prodList.length; pIdx++) {
      const prod = prodList[pIdx];
      const prodNum = pIdx + 1;
      const suffix = prodList.length > 1 ? `, สินค้าที่ ${prodNum}` : "";

      if (!prod.productName?.trim()) {
        return {
          isValid: false,
          error: `กรุณาเลือกสินค้า (รายการที่ ${rowNum}${suffix})`,
        };
      }

      const qty = Number(prod.quantity);
      if (isNaN(qty) || qty <= 0) {
        return {
          isValid: false,
          error: `จำนวนสินค้าต้องมากกว่า 0 (รายการที่ ${rowNum}${suffix})`,
        };
      }
    }
  }

  return { isValid: true };
}
