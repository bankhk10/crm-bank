import { z } from "zod";
import type { Type1UnplannedItem } from "../types/unplanned.types";

export interface ValidateUnplannedOptions {
  item?: Type1UnplannedItem;
  customersList?: Array<{ id: string; name: string }>;
}

export interface UnplannedValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates an unplanned item on the client side (both target and actual outcome)
 */
export function validateType1UnplannedItem({
  item,
  customersList = [],
}: ValidateUnplannedOptions): UnplannedValidationResult {
  if (!item) return { isValid: true };

  const purpose = item.visitPurpose === "STORE" ? "STORE" : "FARMER";

  // 1. Target validation
  if (purpose === "STORE") {
    if (item.isSubDealer) {
      if (item.isUnregisteredSubdealer) {
        if (!item.subDealerStore?.trim()) {
          return { isValid: false, error: "กรุณาระบุชื่อร้าน Subdealer" };
        }
        if (!item.storeId) {
          return { isValid: false, error: "กรุณาเลือก Dealer ต้นสังกัด" };
        }
      } else {
        if (!item.subdealerId) {
          return { isValid: false, error: "กรุณาเลือกร้านค้า Subdealer" };
        }
        if (!item.storeId) {
          return { isValid: false, error: "กรุณาเลือก Dealer ต้นสังกัด" };
        }
      }
    } else {
      const sId =
        item.storeId ||
        customersList.find((c) => c.name === item.customerName)?.id;
      if (!sId) {
        return { isValid: false, error: "กรุณาเลือกร้านค้า Dealer" };
      }
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

  // 2. Actual outcome validation
  if (!item.discussionResult || !item.discussionResult.trim()) {
    return {
      isValid: false,
      error: `กรุณากรอกผลการพูดคุย/เจรจา สำหรับ ${item.customerName || item.unregisteredFarmerName || "เป้าหมาย"}`,
    };
  }

  return { isValid: true };
}

/**
 * Zod schema for Unplanned Type 1 validation
 */
export const type1UnplannedSchema = z
  .object({
    visitPurpose: z.enum(["FARMER", "STORE"]).default("FARMER"),
    storeId: z.string().optional().nullable(),
    province: z.string().optional().nullable(),
    isUnregisteredFarmer: z.boolean().default(false),
    unregisteredFarmerName: z.string().optional().nullable(),
    unregisteredFarmerPhone: z.string().optional().nullable(),
    isSubDealer: z.boolean().default(false),
    subdealerId: z.string().optional().nullable(),
    isUnregisteredSubdealer: z.boolean().default(false),
    subDealerStore: z.string().optional().nullable(),
    topic: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),

    discussionResult: z.string().min(1, "กรุณากรอกผลการพูดคุย/เจรจา"),
    productAdvice: z.string().optional().nullable(),
    salesOpportunity: z.enum(["สูง", "ต่ำ", ""]).optional().nullable(),
    nextMeetingDate: z.string().optional().nullable(),
    farmerHomeAddress: z.string().optional().nullable(),
    plotLatitude: z.string().optional().nullable(),
    plotLongitude: z.string().optional().nullable(),
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
      if (data.isSubDealer) {
        if (data.isUnregisteredSubdealer) {
          if (!data.subDealerStore || !data.subDealerStore.trim()) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "กรุณาระบุชื่อร้าน Subdealer",
              path: ["subDealerStore"],
            });
          }
          if (!data.storeId || !data.storeId.trim()) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "กรุณาเลือก Dealer ต้นสังกัด",
              path: ["storeId"],
            });
          }
        } else {
          if (!data.subdealerId || !data.subdealerId.trim()) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "กรุณาเลือกร้านค้า Subdealer",
              path: ["subdealerId"],
            });
          }
          if (!data.storeId || !data.storeId.trim()) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "กรุณาเลือก Dealer ต้นสังกัด",
              path: ["storeId"],
            });
          }
        }
      } else {
        if (!data.storeId || !data.storeId.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "กรุณาเลือกร้านค้า Dealer",
            path: ["storeId"],
          });
        }
      }
    }
  });
