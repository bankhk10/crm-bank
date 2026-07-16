import { z } from "zod";
import { ActivityApprovalAction } from "@prisma/client";

export const activityPlanSchema = z.object({
  title: z.string().min(1, "กรุณากรอกชื่อกิจกรรม"),
  startDate: z.coerce.date({
    required_error: "กรุณาระบุวันและเวลาเริ่มต้น",
    invalid_type_error: "รูปแบบวันที่เริ่มต้นไม่ถูกต้อง",
  }),
  endDate: z.coerce.date({
    required_error: "กรุณาระบุวันและเวลาสิ้นสุด",
    invalid_type_error: "รูปแบบวันที่สิ้นสุดไม่ถูกต้อง",
  }),
  activityType: z.string().min(1, "กรุณากรอกประเภทกิจกรรม"),
  location: z.string().min(1, "กรุณากรอกรายละเอียดพื้นที่จัดกิจกรรม"),
  objective: z.string().min(1, "กรุณากรอกเป้าหมายกิจกรรม"),
  description: z.string().min(1, "กรุณากรอกรายละเอียดกิจกรรม"),
  salesPromotionBudget: z.number().nonnegative("งบส่งเสริมการขายต้องมีค่ามากกว่าหรือเท่ากับ 0").optional().nullable(),
  marketingBudget: z.number().nonnegative("งบการตลาดต้องมีค่ามากกว่าหรือเท่ากับ 0").optional().nullable(),
  notes: z.string().optional().nullable(),
  helperEmployeeIds: z.array(z.string()).default([]),
}).refine((data) => data.endDate > data.startDate, {
  message: "วันเวลาสิ้นสุดต้องหลังจากวันเวลาเริ่มต้น",
  path: ["endDate"],
});

export const activityApprovalSchema = z.object({
  action: z.enum([
    ActivityApprovalAction.APPROVE,
    ActivityApprovalAction.REJECT,
    ActivityApprovalAction.REQUEST_CORRECTION,
  ], {
    required_error: "กรุณาระบุการดำเนินการ",
  }),
  comment: z.string().optional().nullable(),
});

export type ActivityPlanFormValues = z.infer<typeof activityPlanSchema>;
export type ActivityApprovalFormValues = z.infer<typeof activityApprovalSchema>;
