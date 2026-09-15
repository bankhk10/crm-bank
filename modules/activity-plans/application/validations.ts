import { z } from "zod";

export const planStoreInputSchema = z
  .object({
    workTypeCode: z.string(),
    visitPurpose: z.enum(["FARMER", "STORE"]).optional().nullable(),
    storeId: z.string().optional().nullable(),
    storeName: z.string().optional().nullable(),
    province: z.string().optional().nullable(),
    isUnregisteredFarmer: z.boolean().optional().default(false),
    unregisteredFarmerName: z.string().optional().nullable(),
    unregisteredFarmerPhone: z.string().optional().nullable(),
    targetAmount: z.number().optional().nullable(),
    subDealerStore: z.string().optional().nullable(),
    remarks: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.workTypeCode === "TYPE_1") {
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
    } else {
      if (!data.storeId || !data.storeId.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "กรุณาเลือกร้านค้า",
          path: ["storeId"],
        });
      }
    }
  });

export const planProductInputSchema = z.object({
  workTypeCode: z.string(),
  storeId: z.string().optional().nullable(),
  productId: z.string(),
  productName: z.string().optional().nullable(),
  masterPrice: z.number().optional().nullable(),
  unitPrice: z.number().optional().nullable(),
  isPriceOverridden: z.boolean().optional(),
  targetQuantity: z.number().optional().nullable(),
  targetAmount: z.number().optional().nullable(),
});

export const planMarketingItemInputSchema = z.object({
  category: z.string(),
  materialName: z.string(),
  unit: z.string().optional().nullable(),
  unitPrice: z.number().default(0),
  quantity: z.number().int().default(1),
  totalAmount: z.number().default(0),
});

export const planPromotionItemInputSchema = z.object({
  budgetType: z.string(),
  detail: z.string(),
  amount: z.number().default(0),
});

export const tourDataInputSchema = z.object({
  tourType: z.enum(["CENTRAL", "STORE"]),
  tourSize: z.enum(["SMALL", "LARGE"]).optional().nullable(),
  country: z.string().optional().nullable(),
  storeId: z.string().optional().nullable(),
  destination: z.string().optional().nullable(),
});

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
    workTypeCodes: z.array(z.string()).optional(),
    location: z
      .string()
      .trim()
      .nullable()
      .optional()
      .transform((val) => (val && val.trim() ? val.trim() : null)),
    province: z.string().optional().nullable(),
    district: z.string().optional().nullable(),
    objective: z.string().optional().default(""),
    description: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    // Target metrics (TYPE_8, TYPE_10)
    targetAttendeesCount: z.number().int().optional().nullable(),
    targetBookingSales: z.number().optional().nullable(),
    demoPlotId: z.string().optional().nullable(),
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
    totalBudgetRequested: z.number().optional().nullable(),
    // Normalized child collections
    planStores: z.array(planStoreInputSchema).default([]),
    planProducts: z.array(planProductInputSchema).default([]),
    marketingItems: z.array(planMarketingItemInputSchema).default([]),
    promotionItems: z.array(planPromotionItemInputSchema).default([]),
    tourData: tourDataInputSchema.optional().nullable(),
    helperEmployeeIds: z.array(z.string()).default([]),
    // For transition: raw form items payload (will be normalized in application mapper)
    items: z.array(z.record(z.any())).optional().default([]),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "วันเวลาสิ้นสุดต้องหลังจากวันเวลาเริ่มต้น",
    path: ["endDate"],
  });

export const activityApprovalSchema = z.object({
  action: z.enum(
    ["APPROVE", "REJECT", "REQUEST_CORRECTION"],
    {
      required_error: "กรุณาระบุการดำเนินการ",
    },
  ),
  comment: z.string().optional().nullable(),
  selectedHelperEmployeeIds: z.array(z.string()).optional(),
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
    resultStatus: z
      .enum(["PARTIAL", "COMPLETED", "POSTPONED", "CANCELLED", "FAILED"], {
        required_error: "กรุณาเลือกผลการดำเนินงาน",
      })
      .default("COMPLETED"),
    resultSummary: z.string().optional().nullable(),
    discussionResult: z.string().optional().nullable(),
    productAdvice: z.string().optional().nullable(),
    salesOpportunity: z.string().optional().nullable(),
    problemFound: z.string().optional().nullable(),
    nextAction: z.string().optional().nullable(),
    nextMeetingDate: z.coerce.date().optional().nullable(),
    farmerHomeAddress: z.string().optional().nullable(),
    plotLatitude: z.coerce
      .number()
      .min(-90, "ละติจูดต้องอยู่ระหว่าง -90 ถึง 90")
      .max(90, "ละติจูดต้องอยู่ระหว่าง -90 ถึง 90")
      .optional()
      .nullable(),
    plotLongitude: z.coerce
      .number()
      .min(-180, "ลองจิจูดต้องอยู่ระหว่าง -180 ถึง 180")
      .max(180, "ลองจิจูดต้องอยู่ระหว่าง -180 ถึง 180")
      .optional()
      .nullable(),
    // กรณีเลื่อน หรือ ยกเลิก
    cancelReason: z.string().optional().nullable(),
    postponedDate: z.coerce.date().optional().nullable(),
    postponedTime: z.string().optional().nullable(),
    postponedReason: z.string().optional().nullable(),
    postponedNotes: z.string().optional().nullable(),
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
    // Normalized arrays
    saleResults: z
      .array(
        z.object({
          workTypeCode: z.string(),
          storeId: z.string().optional().nullable(),
          productId: z.string(),
          productName: z.string().optional().nullable(),
          actualQuantity: z.coerce.number().int().min(0),
          actualUnitPrice: z.coerce.number().min(0),
          actualTotal: z.coerce.number().min(0),
          unclosedReason: z.string().optional().nullable(),
        })
      )
      .optional(),
    stockResults: z
      .array(
        z.object({
          storeId: z.string(),
          productId: z.string(),
          remainingQuantity: z.coerce.number().int().min(0),
          stockStatus: z.string().optional().nullable(),
          reorderOpportunity: z.string().optional().nullable(),
          remarks: z.string().optional().nullable(),
        })
      )
      .optional(),
    surveyResults: z
      .array(
        z.object({
          storeId: z.string(),
          productId: z.string().optional().nullable(),
          competitorBrand: z.string(),
          competitorProduct: z.string(),
          competitorPrice: z.coerce.number().optional().nullable(),
          competitorUnit: z.string().optional().nullable(),
          promotionDetail: z.string().optional().nullable(),
        })
      )
      .optional(),
    demoResults: z
      .array(
        z
          .object({
            demoPlotId: z.string().optional().nullable(),
            plannedProductId: z.string().optional().nullable(),
            actualProductId: z.string().optional().nullable(),
            changeReason: z.string().optional().nullable(),
            plotObjective: z.string().optional().nullable(),
            cropAgeValue: z.string().optional().nullable(),
            cropAgeUnit: z.string().optional().nullable(),
            growthStage: z.string().optional().nullable(),
            cropCondition: z.string().optional().nullable(),
            productResponse: z.string().optional().nullable(),
            problemDescription: z.string().optional().nullable(),
            finalYieldKg: z.coerce.number().optional().nullable(),
            controlYieldKg: z.coerce.number().optional().nullable(),
            satisfactionScore: z.coerce.number().int().optional().nullable(),
          })
          .refine(
            (data) => {
              if (
                data.plannedProductId &&
                data.actualProductId &&
                data.plannedProductId !== data.actualProductId
              ) {
                return (
                  typeof data.changeReason === "string" &&
                  data.changeReason.trim().length > 0
                );
              }
              return true;
            },
            {
              message: "กรุณาระบุเหตุผลการเปลี่ยนสินค้าหน้างาน",
              path: ["changeReason"],
            },
          ),
      )
      .optional(),
    followupResults: z
      .array(
        z.object({
          storeId: z.string().optional().nullable(),
          productId: z.string(),
          productName: z.string().optional().nullable(),
          usageResult: z.string().optional().nullable(),
          followupDetail: z.string().optional().nullable(),
          problemDetail: z.string().optional().nullable(),
          isAdditional: z.boolean().default(false),
        })
      )
      .optional(),
    attachments: z
      .array(
        z.object({
          workTypeCode: z.string().optional().nullable(),
          storeId: z.string().optional().nullable(),
          productId: z.string().optional().nullable(),
          category: z.any().optional(),
          fileUrl: z.string(),
          fileName: z.string(),
          fileSize: z.number().optional().nullable(),
          mimeType: z.string().optional().nullable(),
        })
      )
      .refine(
        (items) => {
          const type1PlotPhotos = items.filter(
            (a) => (a.workTypeCode === "TYPE_1" || a.workTypeCode === "เข้าพบเกษตรกร") && String(a.category) === "PLOT"
          );
          return type1PlotPhotos.length <= 5;
        },
        {
          message: "รูปภาพแปลงสำหรับเข้าพบเกษตรกรต้องไม่เกิน 5 รูป",
          path: ["attachments"],
        }
      )
      .optional(),
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
  const quarter = Math.ceil(month / 3); // 1–4
  const msPerDay = 1000 * 60 * 60 * 24;
  const durationDays = Math.max(
    1,
    Math.ceil((endDate.getTime() - startDate.getTime()) / msPerDay),
  );
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

export type ActivityPlanFormValues = z.input<typeof activityPlanSchema>;
export type ActivityApprovalFormValues = z.infer<typeof activityApprovalSchema>;
export type ActivityActualFormValues = z.infer<typeof actualRecordSchema>;
export type ActivityResultFormValues = z.infer<typeof activityResultSchema>;
