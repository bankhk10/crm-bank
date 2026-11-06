import { z } from "zod";
import type { Type1PlannedItem } from "../types/planned.types";

export interface ValidatePlannedOptions {
  item?: Type1PlannedItem;
  customersList?: Array<{ id: string; name: string }>;
}

export interface PlannedValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates a single planned item on the client side
 */
export function validateType1PlannedItem({
  item,
  customersList = [],
}: ValidatePlannedOptions): PlannedValidationResult {
  if (!item) return { isValid: true };

  const purpose = item.visitPurpose === "STORE" ? "STORE" : "FARMER";

  if (purpose === "STORE") {
    const sId =
      item.storeId ||
      customersList.find((c) => c.name === item.customerName)?.id;
    if (!sId) {
      return { isValid: false, error: "กรุณาเลือกร้านค้า" };
    }
  } else {
    // purpose === "FARMER"
    if (!item.province?.trim()) {
      return { isValid: false, error: "กรุณาเลือกจังหวัดสำหรับเข้าพบเกษตรกร" };
    }
    if (item.isUnregisteredFarmer) {
      if (!item.unregisteredFarmerName?.trim()) {
        return { isValid: false, error: "กรุณากรอกชื่อ - สกุล เกษตรกร" };
      }
      if (item.unregisteredFarmerPhone?.trim()) {
        const cleanedPhone = item.unregisteredFarmerPhone.replace(/[-\s]/g, "");
        if (!/^\d{9,10}$/.test(cleanedPhone)) {
          return {
            isValid: false,
            error: "เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก",
          };
        }
      }
    } else {
      const sId =
        item.storeId ||
        customersList.find((c) => c.name === item.customerName)?.id;
      if (!sId) {
        return { isValid: false, error: "กรุณาเลือกเกษตรกรจากรายชื่อ" };
      }
    }
  }

  return { isValid: true };
}

/**
 * Zod schema for Type 1 planned target (Database payload validation)
 */
export const type1PlannedSchema = z
  .object({
    workTypeCode: z.literal("TYPE_1").default("TYPE_1"),
    visitPurpose: z.enum(["FARMER", "STORE"]).default("FARMER"),
    storeId: z.string().optional().nullable(),
    storeName: z.string().optional().nullable(),
    province: z.string().optional().nullable(),
    isUnregisteredFarmer: z.boolean().default(false),
    unregisteredFarmerName: z.string().optional().nullable(),
    unregisteredFarmerPhone: z.string().optional().nullable(),
    topic: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const purpose = data.visitPurpose || "FARMER";
    if (purpose === "FARMER") {
      if (!data.province || !data.province.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณาเลือกจังหวัดสำหรับเข้าพบเกษตรกร",
          path: ["province"],
        });
      }
      if (data.isUnregisteredFarmer) {
        if (!data.unregisteredFarmerName || !data.unregisteredFarmerName.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "กรุณาระบุชื่อ - สกุล เกษตรกร",
            path: ["unregisteredFarmerName"],
          });
        }
        const cleanedPhone = (data.unregisteredFarmerPhone || "").replace(/[-\s]/g, "");
        if (cleanedPhone && !/^[0-9]{9,10}$/.test(cleanedPhone)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "กรุณาระบุเบอร์โทรศัพท์ที่ถูกต้อง (9-10 หลัก)",
            path: ["unregisteredFarmerPhone"],
          });
        }
      } else {
        if (!data.storeId || !data.storeId.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "กรุณาเลือกเกษตรกรจากรายชื่อ",
            path: ["storeId"],
          });
        }
      }
    } else if (purpose === "STORE") {
      if (data.isUnregisteredFarmer) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "เข้าพบร้านค้าไม่อนุญาตให้เลือกไม่มีในระบบ",
          path: ["isUnregisteredFarmer"],
        });
      }
      if (!data.storeId || !data.storeId.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณาเลือกร้านค้า",
          path: ["storeId"],
        });
      }
    }
  });

/**
 * Zod Schema for TYPE 1 Actual Result outcome persistence
 */
export const type1ActualResultSchema = z.object({
  productAdvice: z.string().optional().nullable(),
  products: z
    .array(
      z.object({
        id: z.string().optional(),
        productId: z.string(),
        productName: z.string().optional().nullable(),
        targetId: z.string().optional().nullable(),
      }),
    )
    .optional()
    .nullable(),
  discussionResult: z.string().optional().nullable(),
  salesOpportunity: z.enum(["สูง", "ต่ำ", ""]).optional().nullable(),
  nextMeetingDate: z.coerce.date().optional().nullable(),
  farmerHomeAddress: z.string().optional().nullable(),
  plotLatitude: z.coerce.number().optional().nullable(),
  plotLongitude: z.coerce.number().optional().nullable(),
});

export type Type1PlannedStoreValues = z.infer<typeof type1PlannedSchema>;
export type Type1ActualResultValues = z.infer<typeof type1ActualResultSchema>;
