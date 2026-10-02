import { z } from "zod";
import type { Type2ProductFollowupItem } from "../shared/types";

export interface ValidateType2Options {
  items?: Type2ProductFollowupItem[];
  customersList?: Array<{ id: string; name: string }>;
  selectedWorkTypes?: string[];
}

export interface Type2ValidationResult {
  isValid: boolean;
  error?: string;
}

export const type2FollowupProductLineSchema = z.object({
  id: z.string().optional(),
  productId: z.string().optional(),
  productName: z.string().optional(),
  notes: z.string().optional(),
});

export const type2ProductFollowupItemSchema = z.object({
  id: z.string().optional(),
  visitPurpose: z.enum(["FARMER", "STORE"]).optional(),
  province: z.string().optional(),
  isUnregisteredFarmer: z.boolean().optional(),
  storeId: z.string().optional(),
  customerName: z.string().optional(),
  unregisteredFarmerName: z.string().optional(),
  unregisteredFarmerPhone: z.string().optional(),
  products: z.array(type2FollowupProductLineSchema).optional(),
  productId: z.string().optional(),
  productName: z.string().optional(),
  detail: z.string().optional(),
});

export const createType2ValidationSchema = (
  customersList: Array<{ id: string; name: string }> = [],
) =>
  z
    .array(type2ProductFollowupItemSchema)
    .min(1, "กรุณาเพิ่มรายการติดตามผลการใช้สินค้าอย่างน้อย 1 รายการ")
    .superRefine((items, ctx) => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const rowNum = i + 1;

        const prodLines =
          item.products && item.products.length > 0
            ? item.products
            : [
                {
                  id: "p-0",
                  productName: item.productName || "",
                  productId: item.productId,
                },
              ];

        if (prodLines.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `กรุณาเพิ่มสินค้าที่ต้องการติดตามผลอย่างน้อย 1 รายการ (รายการที่ ${rowNum})`,
            path: [i, "products"],
          });
        }

        for (let pIdx = 0; pIdx < prodLines.length; pIdx++) {
          const p = prodLines[pIdx];
          if (!p.productName?.trim() && !p.productId?.trim()) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `กรุณาเลือกสินค้าที่ต้องการติดตามผล (รายการที่ ${rowNum}${prodLines.length > 1 ? ` สินค้าลำดับที่ ${pIdx + 1}` : ""})`,
              path: [i, "products", pIdx, "productName"],
            });
          }
        }

        const purpose = item.visitPurpose === "STORE" ? "STORE" : "FARMER";
        if (purpose === "STORE") {
          const sId =
            item.storeId ||
            customersList.find((c) => c.name === item.customerName)?.id;
          if (!sId) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `กรุณาเลือกร้านค้าสำหรับติดตามผลการใช้สินค้า (รายการที่ ${rowNum})`,
              path: [i, "storeId"],
            });
          }
        } else {
          // purpose === "FARMER"
          if (!item.province?.trim()) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `กรุณาเลือกจังหวัดสำหรับเข้าพบเกษตรกร (รายการที่ ${rowNum})`,
              path: [i, "province"],
            });
          }
          if (item.isUnregisteredFarmer) {
            if (!item.unregisteredFarmerName?.trim()) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `กรุณากรอกชื่อ - สกุล เกษตรกร (รายการที่ ${rowNum})`,
                path: [i, "unregisteredFarmerName"],
              });
            }
            if (!item.unregisteredFarmerPhone?.trim()) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `กรุณากรอกเบอร์โทรศัพท์เกษตรกร (รายการที่ ${rowNum})`,
                path: [i, "unregisteredFarmerPhone"],
              });
            } else {
              const cleanedPhone = item.unregisteredFarmerPhone.replace(
                /[-\s]/g,
                "",
              );
              if (!/^\d{9,10}$/.test(cleanedPhone)) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: `เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก (รายการที่ ${rowNum})`,
                  path: [i, "unregisteredFarmerPhone"],
                });
              }
            }
          } else {
            const sId =
              item.storeId ||
              customersList.find((c) => c.name === item.customerName)?.id;
            if (!sId) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `กรุณาเลือกเกษตรกรสำหรับติดตามผลการใช้สินค้า (รายการที่ ${rowNum})`,
                path: [i, "storeId"],
              });
            }
          }
        }
      }
    });

/**
 * Zod-based validation function for TYPE 2 (Product Follow-up) form items.
 * Validates product selection, customer/farmer selection according to purpose
 * (FARMER vs STORE), and registered vs unregistered farmer details.
 */
export function validateType2FormItems({
  items = [],
  customersList = [],
  selectedWorkTypes = [],
}: ValidateType2Options): Type2ValidationResult {
  if (!selectedWorkTypes.includes("ติดตามผลการใช้สินค้า")) {
    return { isValid: true };
  }

  const schema = createType2ValidationSchema(customersList);
  const result = schema.safeParse(items);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    return {
      isValid: false,
      error: firstIssue?.message || "ข้อมูลติดตามผลการใช้สินค้าไม่ถูกต้อง",
    };
  }

  return { isValid: true };
}
