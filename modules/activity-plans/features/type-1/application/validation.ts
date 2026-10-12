import { z } from "zod";
import { getWorkTypeCode } from "@/modules/activity-plans/constants";
import type {
  Type1VisitItem,
  ValidateType1Options,
  Type1ValidationResult,
} from "../types";

export type { ValidateType1Options, Type1ValidationResult };

/**
 * Pure validation function for TYPE 1 (Visit Farmer / Store) form item.
 * Validates client-side form state according to purpose (FARMER vs STORE)
 * and registered vs unregistered farmer rules.
 */
export function validateType1FormItem({
  item,
  customersList = [],
  selectedWorkTypes = [],
}: ValidateType1Options): Type1ValidationResult {
  const isSelected = selectedWorkTypes.some(
    (wt) =>
      getWorkTypeCode(wt) === "TYPE_1" ||
      wt === "เข้าพบเกษตรกร" ||
      wt === "เข้าพบร้านค้า / Key Farmer",
  );

  if (!isSelected) return { isValid: true };

  const purpose = item?.visitPurpose === "STORE" ? "STORE" : "FARMER";

  if (purpose === "STORE") {
    const sId =
      item?.storeId ||
      customersList.find((c) => c.name === item?.customerName)?.id;
    if (!sId) {
      return { isValid: false, error: "กรุณาเลือกร้านค้า" };
    }
  } else {
    // purpose === "FARMER"
    if (!item || !item.province?.trim()) {
      return { isValid: false, error: "กรุณาเลือกจังหวัดสำหรับเข้าพบเกษตรกร" };
    }
    if (item.isUnregisteredFarmer) {
      if (!item.unregisteredFarmerName?.trim()) {
        return { isValid: false, error: "กรุณากรอกชื่อ - สกุล เกษตรกร" };
      }
      if (item.unregisteredFarmerPhone?.trim()) {
        const cleanedPhone = item.unregisteredFarmerPhone.replace(
          /[-\s]/g,
          "",
        );
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
        return { isValid: false, error: "กรุณาเลือกเกษตรกร" };
      }
    }
  }

  return { isValid: true };
}

/**
 * Zod Schema for TYPE 1 Plan Store persistence & backend validation
 */
export const type1PlanStoreSchema = z
  .object({
    workTypeCode: z.literal("TYPE_1").default("TYPE_1"),
    visitPurpose: z.enum(["FARMER", "STORE"]).default("FARMER"),
    storeId: z.string().optional().nullable(),
    storeName: z.string().optional().nullable(),
    province: z.string().optional().nullable(),
    isUnregisteredFarmer: z.boolean().default(false),
    unregisteredFarmerName: z.string().optional().nullable(),
    unregisteredFarmerPhone: z.string().optional().nullable(),
    remarks: z.string().optional().nullable(), // Topic
    notes: z.string().optional().nullable(), // Detail
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
        const cleanedPhone = (data.unregisteredFarmerPhone || "").replace(
          /[-\s]/g,
          "",
        );
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
  discussionResult: z.string().optional().nullable(),
  salesOpportunity: z.enum(["สูง", "ต่ำ", ""]).optional().nullable(),
  nextMeetingDate: z.coerce.date().optional().nullable(),
  farmerHomeAddress: z.string().optional().nullable(),
  plotLatitude: z.coerce.number().optional().nullable(),
  plotLongitude: z.coerce.number().optional().nullable(),
});

export type Type1PlanStoreValues = z.infer<typeof type1PlanStoreSchema>;
export type Type1ActualResultValues = z.infer<typeof type1ActualResultSchema>;
export const type1PlanStoresSchema = z.array(type1PlanStoreSchema);
export type Type1PlanStoresValues = z.infer<typeof type1PlanStoresSchema>;
