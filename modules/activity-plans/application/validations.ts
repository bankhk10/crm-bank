import { z } from "zod";
import { ActivityApprovalAction } from "@prisma/client";

export const activityPlanSchema = z
  .object({
    title: z.string().min(1, "กรุณากรอกชื่อกิจกรรม"),
    startDate: z.coerce.date({
      required_error: "กรุณาระบุวันและเวลาเริ่มต้น",
      invalid_type_error: "รูปแบบวันที่เริ่มต้นไม่ถูกต้อง",
    }),
    endDate: z.coerce.date({
      required_error: "กรุณาระบุวันและเวลาสิ้นสุด",
      invalid_type_error: "รูปแบบวันที่สิ้นสุดไม่ถูกต้อง",
    }),
    activityTypeId: z.string().min(1, "กรุณาเลือกประเภทกิจกรรม"),
    location: z.string().min(1, "กรุณากรอกรายละเอียดพื้นที่จัดกิจกรรม"),
    province: z.string().optional().nullable(),
    district: z.string().optional().nullable(),
    objective: z.string().min(1, "กรุณากรอกเป้าหมายกิจกรรม"),
    description: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    // งบประมาณ (ที่ขอ)
    salesPromotionBudgetRequested: z
      .number()
      .nonnegative("งบส่งเสริมการขายต้องมีค่ามากกว่าหรือเท่ากับ 0")
      .optional()
      .nullable(),
    marketingBudgetRequested: z
      .number()
      .nonnegative("งบการตลาดต้องมีค่ามากกว่าหรือเท่ากับ 0")
      .optional()
      .nullable(),
    // รายการย่อยตามประเภทงาน (แทน details JSON เดิม)
    items: z.array(z.record(z.any())).default([]),
    helperEmployeeIds: z.array(z.string()).default([]),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "วันเวลาสิ้นสุดต้องหลังจากวันเวลาเริ่มต้น",
    path: ["endDate"],
  });

export const activityApprovalSchema = z.object({
  action: z.enum(
    [
      ActivityApprovalAction.APPROVE,
      ActivityApprovalAction.REJECT,
      ActivityApprovalAction.REQUEST_CORRECTION,
    ],
    {
      required_error: "กรุณาระบุการดำเนินการ",
    },
  ),
  comment: z.string().optional().nullable(),
});

export const actualRecordSchema = z.object({
  planId: z.string().optional(),
  plotName: z.string().min(1, "กรุณากรอกชื่อแปลงสาธิต"),
  usageMethod: z.string().min(1, "กรุณากรอกวิธีการใช้ / อัตราการใช้"),
  cropAgeValue: z.coerce.number().min(0, "อายุพืชต้องไม่ติดลบ"),
  cropAgeUnit: z.string().default("วัน"),
  growthStage: z.string().min(1, "กร้าเลือกระยะการเจริญเติบโต"),
  cropCondition: z.enum(["สมบูรณ์", "ไม่เปลี่ยนแปลง", "มีปัญหา"], {
    required_error: "กรุณาเลือกสภาพพืช",
  }),
  cropProblemDescription: z
    .string()
    .max(500, "ระบุปัญหาที่พบ (สภาพพืช) ต้องไม่เกิน 500 ตัวอักษร")
    .optional()
    .nullable(),
  productResponse: z.enum(["พืชตอบสนองดี", "ยังไม่เห็นผลชัดเจน", "พบปัญหา"], {
    required_error: "กรุณาเลือกผลการใช้ผลิตภัณฑ์",
  }),
  problemDescription: z
    .string()
    .max(500, "ระบุปัญหาที่พบต้องไม่เกิน 500 ตัวอักษร")
    .optional()
    .nullable(),
  plotImageUrls: z.array(z.string()).default([]),
  activityFormat: z.string().min(1, "กรุณาเลือกรูปแบบกิจกรรม"),
  actualSales: z.coerce.number().min(0, "ยอดขายต้องไม่ติดลบ"),
  actualAttendees: z.coerce.number().min(0, "จำนวนลูกค้าต้องไม่ติดลบ"),
  atmosphereImageUrls: z.array(z.string()).default([]),
});

/**
 * Schema สำหรับบันทึกผลหลังกิจกรรม (ActivityResult)
 * สร้างได้เฉพาะเมื่อ ActivityPlan.status = APPROVED
 */
export const activityResultSchema = z
  .object({
    actualStartDate: z.coerce.date({
      required_error: "กรุณาระบุวันที่เริ่มต้นจริง",
    }),
    actualEndDate: z.coerce.date({
      required_error: "กรุณาระบุวันที่สิ้นสุดจริง",
    }),
    actualAttendeesCount: z.coerce.number().int().min(0).optional().nullable(),
    resultStatus: z.enum(["COMPLETED", "PARTIAL", "FAILED"], {
      required_error: "กรุณาเลือกผลการดำเนินงาน",
    }),
    resultSummary: z.string().optional().nullable(),
    problemFound: z.string().optional().nullable(),
    nextAction: z.string().optional().nullable(),
    // งบประมาณที่ใช้จริง
    actualSalesPromotionSpent: z.coerce.number().min(0).optional().nullable(),
    actualMarketingSpent: z.coerce.number().min(0).optional().nullable(),
    actualTotalSpent: z.coerce.number().min(0).optional().nullable(),
    // KPI ตามประเภทงาน
    salesResultAmount: z.coerce.number().min(0).optional().nullable(),
    salesOrdersCount: z.coerce.number().int().min(0).optional().nullable(),
    collectResultAmount: z.coerce.number().min(0).optional().nullable(),
    demoPlotsCreated: z.coerce.number().int().min(0).optional().nullable(),
    demoPlotsFollowedUp: z.coerce.number().int().min(0).optional().nullable(),
    distributorsCount: z.coerce.number().int().min(0).optional().nullable(),
    farmersCount: z.coerce.number().int().min(0).optional().nullable(),
  })
  .refine((data) => data.actualEndDate >= data.actualStartDate, {
    message: "วันเวลาสิ้นสุดต้องไม่ก่อนวันเวลาเริ่มต้น",
    path: ["actualEndDate"],
  });

// ────────────────────────────────────────────────────────────────────────────
// Utility: คำนวณ Fiscal Dimensions จาก startDate (ใช้ใน application layer)
// ────────────────────────────────────────────────────────────────────────────

export function computeFiscalFields(startDate: Date, endDate: Date) {
  const year = startDate.getFullYear();
  const month = startDate.getMonth() + 1; // 1–12
  const quarter = Math.ceil(month / 3);   // 1–4
  const msPerDay = 1000 * 60 * 60 * 24;
  const durationDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / msPerDay));
  return {
    fiscalYear: year,
    fiscalMonth: month,
    fiscalQuarter: quarter,
    durationDays,
  };
}

/**
 * คำนวณยอดงบรวม (auto-sum)
 */
export function computeTotalBudget(
  salesPromotion?: number | null,
  marketing?: number | null,
): number {
  return (salesPromotion ?? 0) + (marketing ?? 0);
}

export type ActivityPlanFormValues = z.infer<typeof activityPlanSchema>;
export type ActivityApprovalFormValues = z.infer<typeof activityApprovalSchema>;
export type ActivityActualFormValues = z.infer<typeof actualRecordSchema>;
export type ActivityResultFormValues = z.infer<typeof activityResultSchema>;
