import type {
  ActivityResultStatusType,
  PlanSummaryData,
  Type5SurveyRecord,
  FollowupProductItem,
  ImageFile,
} from "../types";
import { getActivityResultStatusLabel } from "../../../constants";

export interface BuildSummaryInput {
  activityResultStatus: ActivityResultStatusType;
  cancelReason: string;
  postponedDate: string;
  postponedTime: string;
  postponedReason: string;
  postponedNotes: string;

  planSummary: PlanSummaryData;
  products?: Array<{ id: string; name: string; productCode?: string | null }>;

  // Type 1
  t1ProductAdvice: string;
  t1SalesOpportunity: "สูง" | "ต่ำ" | "";
  t1DiscussionResult: string;
  t1Detail: string;
  t1NextAction: string;
  t1NextMeetingDate: string;
  t1FarmerHomeAddress?: string;
  t1PlotLatitude?: string | number | null;
  t1PlotLongitude?: string | number | null;
  t1PlotImages?: ImageFile[];

  // Type 2
  t2CustomerName: string;
  t2FollowupDetail: string;
  t2Detail: string;
  t2UsageResult: "พืชตอบสนองดี" | "ลูกค้าพึงพอใจ" | "พบปัญหา" | "";
  t2ProblemDetail: string;
  t2FollowupResults?: FollowupProductItem[];
  t2Images?: ImageFile[];

  // Type 3
  t3SoldProducts: string;
  t3ActualSales: string;
  t3ActualQuantity: string;
  t3UnclosedReason: string;
  t3ProductSalesDetails?: any[];

  // Type 4
  t4OrderNo: string;
  t4ReceivedAmount: string;
  t4BillingStatus?: string;
  t4Detail?: string;

  // Type 5
  t5CompetitorBrand: string;
  t5CompetitorProduct: string;
  t5CompetitorPrice: string;
  t5CompetitorUnit: string;
  t5PromotionDetail: string;
  t5SurveyDetails?: Type5SurveyRecord[];

  // Type 6
  t6ProblemDetail: string;
  t6InitialSolution: string;
  t6Status: "เสร็จสิ้น" | "รอติดตาม" | "";
  t6Images?: ImageFile[];

  // Type 7
  t7PlotName?: string;
  t7PlannedProductId?: string | null;
  t7ActualProductId?: string | null;
  t7PlannedProductName?: string | null;
  t7ActualProductName?: string | null;
  t7DemoProductQuantity?: string | number | null;
  t7ChangeReason?: string;
  t7PlotObjective?: string;
  t7CustomPlotDetail?: string;
  t7DemoPlotId?: string | null;
  t7PlantingDate: string;
  t7PlantingAreaCondition: string;
  t7UsageMethod: string;
  t7CropAgeValue: string;
  t7CropAgeUnit: string;
  t7GrowthStage: string;
  t7CropCondition: "สมบูรณ์" | "มีปัญหา" | "ปานกลาง" | "ทรุดโทรม" | "";
  t7CropProblemDescription: string;
  t7ProductResponse: "พืชตอบสนองดี" | "พบปัญหา" | "";
  t7ProblemDescription: string;
  t7PlotStatus: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  t7NextFollowUpDate: string;
  t7FinalYieldKg: string;
  t7ControlYieldKg: string;
  t7YieldIncreasePercent: string;
  t7FarmerSatisfaction: number;
  t7CommercialPotential: string;
  t7FinalSummaryNotes: string;
  t7CropImages?: ImageFile[];
  t7PlotImages?: ImageFile[];

  // Type 8
  t8ActualAttendees: string;
  t8FeedbackQnA: string;
  t8ProductSalesDetails: any[];
  t8Images?: ImageFile[];

  // Type 9
  t9ActualSales: string;
  t9ProductSalesDetails: any[];
  t9ActualAttendees: string;
  t9Images?: ImageFile[];

  // Type 10
  t10ActualAttendees: string;
  t10ActualSalesOrBooking: string;
  t10FarmerFeedback: "สูง" | "กลาง" | "ต่ำ" | "";
  t10TargetFarmersList: string;
  t10Images?: ImageFile[];

  // Type 11
  t11StockItems: any[];
  t11ProductList: string;
  t11RemainingQty: string;
  t11Remarks: string;
  t11StockStatus: "ใกล้หมด" | "ขาดสต็อก" | "";
  t11ReorderOpportunity: "สูง" | "ต่ำ" | "ยังไม่แน่ใจ" | "";
  t11NextAction: string;
}

export interface BuildSummaryResult {
  validationError?: string;
  summaryParts: string[];
  payload: any;
}

/**
 * Safely parse a numeric string or number into a clean number or null
 * Preserves 0, strips commas and non-numeric chars, never returns NaN
 */
export function parseCleanNumber(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") return isNaN(val) ? null : val;
  if (typeof val !== "string") return null;
  const trimmed = val.trim();
  if (trimmed === "") return null;
  const sanitized = trimmed.replace(/,/g, "").replace(/[^\d.-]/g, "");
  if (sanitized === "" || sanitized === "-" || sanitized === ".") return null;
  const num = parseFloat(sanitized);
  return isNaN(num) ? null : num;
}

export function buildResultSummary(
  input: BuildSummaryInput,
): BuildSummaryResult {
  const {
    activityResultStatus,
    cancelReason,
    postponedDate,
    postponedTime,
    postponedReason,
    postponedNotes,
    planSummary,
    t1ProductAdvice,
    t1SalesOpportunity,
    t1DiscussionResult,
    t1Detail,
    t1NextAction,
    t1NextMeetingDate,
    t2CustomerName,
    t2FollowupDetail,
    t2Detail,
    t2UsageResult,
    t2ProblemDetail,
    t2Images,
    t3SoldProducts,
    t3ActualSales,
    t3ActualQuantity,
    t3UnclosedReason,
    t3ProductSalesDetails,
    t4OrderNo,
    t4ReceivedAmount,
    t4BillingStatus,
    t4Detail,
    t5CompetitorBrand,
    t5CompetitorProduct,
    t5CompetitorPrice,
    t5CompetitorUnit,
    t5PromotionDetail,
    t5SurveyDetails,
    t6ProblemDetail,
    t6InitialSolution,
    t6Status,
    t6Images,
    t7PlotName = "",
    t7PlotObjective,
    t7CustomPlotDetail,
    t7PlantingDate,
    t7PlantingAreaCondition,
    t7UsageMethod,
    t7CropAgeValue,
    t7CropAgeUnit,
    t7GrowthStage,
    t7CropCondition,
    t7CropProblemDescription,
    t7ProductResponse,
    t7ProblemDescription,
    t7PlotStatus,
    t7NextFollowUpDate,
    t7FinalYieldKg,
    t7ControlYieldKg,
    t7YieldIncreasePercent,
    t7FarmerSatisfaction,
    t7CommercialPotential,
    t7FinalSummaryNotes,
    t7CropImages,
    t7PlotImages,
    t8ActualAttendees,
    t8FeedbackQnA,
    t8ProductSalesDetails,
    t8Images,
    t9ActualSales,
    t9ProductSalesDetails,
    t9ActualAttendees,
    t9Images,
    t10ActualAttendees,
    t10ActualSalesOrBooking,
    t10FarmerFeedback,
    t10TargetFarmersList,
    t10Images,
    t11StockItems,
    t11ProductList,
    t11RemainingQty,
    t11Remarks,
    t11StockStatus,
    t11ReorderOpportunity,
    t11NextAction,
  } = input;

  // Validate Cancel / Postponed fields
  if (activityResultStatus === "CANCELLED" && !cancelReason.trim()) {
    return {
      validationError: "กรุณาระบุสาเหตุที่ยกเลิกกิจกรรม",
      summaryParts: [],
      payload: null,
    };
  }

  if (activityResultStatus === "POSTPONED") {
    if (!postponedDate) {
      return {
        validationError: "กรุณาระบุวันที่ใหม่สำหรับการเลื่อนกิจกรรม",
        summaryParts: [],
        payload: null,
      };
    }
    if (!postponedReason) {
      return {
        validationError: "กรุณาเลือกเหตุผลที่เลื่อนกิจกรรม",
        summaryParts: [],
        payload: null,
      };
    }
  }

  // Validate Type 7 Product Change
  const isT7ProductChanged =
    Boolean(input.t7ActualProductId) &&
    Boolean(input.t7PlannedProductId) &&
    input.t7ActualProductId !== input.t7PlannedProductId;

  if (
    isT7ProductChanged &&
    (!input.t7ChangeReason || !input.t7ChangeReason.trim())
  ) {
    return {
      validationError: "กรุณาระบุเหตุผลการเปลี่ยนสินค้าหน้างาน (Work Type 7)",
      summaryParts: [],
      payload: null,
    };
  }

  // Validate Type 1 Plot Images (Max 5 files)
  if (input.t1PlotImages && input.t1PlotImages.length > 5) {
    return {
      validationError: "รูปแปลงสามารถแนบได้สูงสุด 5 รูป (Work Type 1)",
      summaryParts: [],
      payload: null,
    };
  }

  const statusLabel = getActivityResultStatusLabel(activityResultStatus);

  const summaryParts = [
    `สถานะผลกิจกรรม: ${statusLabel}`,
    activityResultStatus === "CANCELLED" && cancelReason
      ? `สาเหตุที่ยกเลิก: ${cancelReason}`
      : null,
    activityResultStatus === "POSTPONED" && postponedDate
      ? `วันที่ใหม่: ${postponedDate}`
      : null,
    activityResultStatus === "POSTPONED" && postponedTime
      ? `เวลาใหม่: ${postponedTime}`
      : null,
    activityResultStatus === "POSTPONED" && postponedReason
      ? `เหตุผลที่เลื่อน: ${postponedReason}`
      : null,
    activityResultStatus === "POSTPONED" && postponedNotes
      ? `หมายเหตุการเลื่อน: ${postponedNotes}`
      : null,

    // Type 1
    t1ProductAdvice ? `สินค้าที่แนะนำ: ${t1ProductAdvice}` : null,
    t1SalesOpportunity ? `โอกาสการขาย: ${t1SalesOpportunity}` : null,
    t1DiscussionResult ? `ผลการพูดคุย: ${t1DiscussionResult}` : null,
    t1Detail ? `รายละเอียดเข้าพบ: ${t1Detail}` : null,
    t1NextAction ? `สิ่งที่ต้องดำเนินการต่อ: ${t1NextAction}` : null,
    t1NextMeetingDate ? `วันที่นัดหมายครั้งถัดไป: ${t1NextMeetingDate}` : null,
    input.t1FarmerHomeAddress
      ? `ที่อยู่บ้านเกษตรกร: ${input.t1FarmerHomeAddress}`
      : null,
    input.t1PlotLatitude && input.t1PlotLongitude
      ? `พิกัดแปลง: ${input.t1PlotLatitude}, ${input.t1PlotLongitude}`
      : null,
    input.t1PlotImages && input.t1PlotImages.length > 0
      ? `รูปแปลง: มีแนบ ${input.t1PlotImages.length} รูป`
      : null,

    // Type 2
    t2CustomerName ? `ลูกค้าติดตาม: ${t2CustomerName}` : null,
    (() => {
      const isProblem =
        t2UsageResult === "พบปัญหา" ||
        (typeof t2UsageResult === "string" &&
          t2UsageResult.includes("พบปัญหา") &&
          !t2UsageResult.includes("พืชตอบสนองดี") &&
          !t2UsageResult.includes("ลูกค้าพึงพอใจ"));
      if (isProblem) return null;
      const cleanDetail = t2FollowupDetail?.trim() || t2Detail?.trim() || "";
      return cleanDetail ? `ติดตามผล: ${cleanDetail}` : null;
    })(),
    t2UsageResult ? `ผลลัพธ์การใช้: ${t2UsageResult}` : null,
    (t2UsageResult === "พบปัญหา" ||
      (typeof t2UsageResult === "string" &&
        t2UsageResult.includes("พบปัญหา"))) &&
    t2ProblemDetail
      ? `ปัญหาการใช้สินค้า: ${t2ProblemDetail}`
      : null,
    t2Images && t2Images.length > 0
      ? `รูปภาพการติดตามผล: มีแนบ ${t2Images.length} รูป`
      : null,

    // Type 3
    t3SoldProducts ? `รายการขาย: ${t3SoldProducts}` : null,
    t3ActualSales ? `ยอดขายจริง: ${t3ActualSales}` : null,
    t3ActualQuantity ? `จำนวนที่ขายจริง: ${t3ActualQuantity}` : null,
    t3UnclosedReason ? `เหตุผลที่ปิดการขายไม่ได้: ${t3UnclosedReason}` : null,
    t3ProductSalesDetails &&
    t3ProductSalesDetails.length > 0 &&
    t3ProductSalesDetails.some(
      (d) => d.actualQty || d.actualSales || d.unclosedReason,
    )
      ? `ยอดขายแยกสินค้า: ${t3ProductSalesDetails
          .filter((d) => d.actualQty || d.actualSales || d.unclosedReason)
          .map(
            (d) =>
              `${d.productName || "สินค้า"}: ขายได้ ${d.actualQty || 0} ชิ้น (${d.actualSales || 0} บ.)${d.unclosedReason ? ` [ไม่สำเร็จ: ${d.unclosedReason}]` : ""}`,
          )
          .join("; ")}`
      : null,

    // Type 4
    t4OrderNo ? `เลขที่บิล/ใบแจ้งหนี้: ${t4OrderNo}` : null,
    t4BillingStatus ? `สถานะการวางบิล: ${t4BillingStatus}` : null,
    t4ReceivedAmount ? `ยอดเงินที่เก็บได้จริง: ${t4ReceivedAmount}` : null,
    t4Detail ? `รายละเอียดเพิ่มเติม (วางบิล/เก็บเงิน): ${t4Detail}` : null,

    // Type 5
    t5CompetitorBrand ? `แบรนด์คู่แข่ง: ${t5CompetitorBrand}` : null,
    t5CompetitorProduct ? `สินค้าคู่แข่ง: ${t5CompetitorProduct}` : null,
    t5CompetitorPrice ? `ราคาคู่แข่ง: ${t5CompetitorPrice}` : null,
    t5CompetitorUnit ? `หน่วยนับคู่แข่ง: ${t5CompetitorUnit}` : null,
    t5PromotionDetail ? `โปรโมชันคู่แข่ง: ${t5PromotionDetail}` : null,
    t5SurveyDetails &&
    t5SurveyDetails.length > 0 &&
    t5SurveyDetails.some(
      (s) =>
        s.competitorBrand ||
        s.competitorProduct ||
        s.competitorPrice ||
        s.promotionDetail ||
        (s.priceTagImages && s.priceTagImages.length > 0) ||
        (s.shelfImages && s.shelfImages.length > 0),
    )
      ? `รายการสำรวจตลาดคู่แข่ง: มีบันทึก ${t5SurveyDetails.length} รายการ`
      : null,

    // Type 6
    t6ProblemDetail ? `ปัญหาลูกค้าร้องเรียน: ${t6ProblemDetail}` : null,
    t6InitialSolution ? `แนวทางแก้ไขเบื้องต้น: ${t6InitialSolution}` : null,
    t6Status ? `สถานะการแก้ปัญหา: ${t6Status}` : null,
    t6Images && t6Images.length > 0
      ? `รูปภาพปัญหา/การแก้ไข: มีแนบ ${t6Images.length} รูป`
      : null,

    // Type 7
    isT7ProductChanged
      ? `⚠️ เปลี่ยนสินค้าหน้างาน: ${input.t7ActualProductName || "สินค้าใหม่"} (สินค้าตามแผน: ${input.t7PlannedProductName || "สินค้าเดิม"}) เหตุผล: ${input.t7ChangeReason?.trim()}`
      : null,
    input.t7DemoPlotId === "OTHER" ? `แปลงเกษตร: แปลงอื่นๆ` : null,
    t7CustomPlotDetail?.trim()
      ? `รายละเอียดแปลง: ${t7CustomPlotDetail.trim()}`
      : null,
    t7PlotName ? `ชื่อแปลงทดสอบ: ${t7PlotName}` : null,
    t7PlotObjective ? `วัตถุประสงค์ของแปลง: ${t7PlotObjective}` : null,
    t7PlantingDate ? `วันที่ปลูก: ${t7PlantingDate}` : null,
    t7PlantingAreaCondition
      ? `สภาพพื้นที่ปลูก: ${t7PlantingAreaCondition}`
      : null,
    t7UsageMethod ? `วิธีใช้/อัตราการใช้: ${t7UsageMethod}` : null,
    t7CropAgeValue
      ? `อายุพืช: ${t7CropAgeValue} ${t7CropAgeUnit || "วัน"}`
      : null,
    t7GrowthStage ? `ระยะการเจริญเติบโต: ${t7GrowthStage}` : null,
    t7CropCondition ? `สภาพแปลง: ${t7CropCondition}` : null,
    t7CropProblemDescription
      ? `ปัญหาของสภาพพืช: ${t7CropProblemDescription}`
      : null,
    t7ProductResponse ? `ผลการใช้ผลิตภัณฑ์: ${t7ProductResponse}` : null,
    t7ProblemDescription
      ? `รายละเอียดปัญหาการใช้ผลิตภัณฑ์: ${t7ProblemDescription}`
      : null,
    t7PlotStatus ? `สถานะแปลง: ${t7PlotStatus}` : null,
    t7NextFollowUpDate
      ? `กำหนดการติดตามครั้งถัดไป: ${t7NextFollowUpDate}`
      : null,
    t7FinalYieldKg ? `ผลผลิตแปลงสาธิต: ${t7FinalYieldKg} กก./ไร่` : null,
    t7ControlYieldKg ? `ผลผลิตแปลงควบคุม: ${t7ControlYieldKg} กก./ไร่` : null,
    t7YieldIncreasePercent
      ? `% ผลผลิตเพิ่มขึ้น: ${t7YieldIncreasePercent}%`
      : null,
    t7FarmerSatisfaction
      ? `ความพึงพอใจเกษตรกร: ${t7FarmerSatisfaction}/5`
      : null,
    t7CommercialPotential
      ? `โอกาสสั่งซื้อจริง: ${t7CommercialPotential}`
      : null,
    t7FinalSummaryNotes ? `สรุปผลสัมฤทธิ์แปลง: ${t7FinalSummaryNotes}` : null,
    t7CropImages && t7CropImages.length > 0
      ? `รูปภาพสภาพพืช: มีแนบ ${t7CropImages.length} รูป`
      : null,
    t7PlotImages && t7PlotImages.length > 0
      ? `รูปภาพสภาพแปลง: มีแนบ ${t7PlotImages.length} รูป`
      : null,

    // Type 8
    t8ActualAttendees
      ? `จำนวนผู้เข้าร่วมประชุมจริง: ${t8ActualAttendees}`
      : null,
    t8FeedbackQnA ? `Q&A: ${t8FeedbackQnA}` : null,
    t8ProductSalesDetails &&
    t8ProductSalesDetails.length > 0 &&
    t8ProductSalesDetails.some((d) => d.actualQty || d.actualSales)
      ? `ยอดขายแยกสินค้าประชุม: มีบันทึก ${t8ProductSalesDetails.length} รายการ`
      : null,
    t8Images && t8Images.length > 0
      ? `รูปภาพบรรยากาศการประชุม: มีแนบ ${t8Images.length} รูป`
      : null,

    // Type 9
    t9ActualSales ? `ยอดขายหน้าร้านจริง: ${t9ActualSales}` : null,
    t9ProductSalesDetails &&
    t9ProductSalesDetails.length > 0 &&
    t9ProductSalesDetails.some((d) => d.actualQuantityCases || d.actualSales)
      ? `ยอดขายแยกสินค้าหน้าร้าน: มีบันทึก ${t9ProductSalesDetails.length} รายการ`
      : null,
    t9ActualAttendees
      ? `จำนวนผู้เข้าร่วมกิจกรรมหน้าร้าน: ${t9ActualAttendees}`
      : null,
    t9Images && t9Images.length > 0
      ? `รูปภาพกิจกรรมส่งเสริมการขายหน้าร้าน: มีแนบ ${t9Images.length} รูป`
      : null,

    // Type 10
    t10ActualAttendees
      ? `จำนวนผู้เข้าร่วม Field Day จริง: ${t10ActualAttendees}`
      : null,
    t10ActualSalesOrBooking
      ? `ยอดขายหรือยอดจอง Field Day จริง: ${t10ActualSalesOrBooking}`
      : null,
    t10FarmerFeedback ? `ความสนใจเกษตรกร: ${t10FarmerFeedback}` : null,
    t10TargetFarmersList
      ? `รายชื่อเกษตรกรเป้าหมาย: ${t10TargetFarmersList}`
      : null,
    t10Images && t10Images.length > 0
      ? `รูปภาพบรรยากาศงาน Field Day: มีแนบ ${t10Images.length} รูป`
      : null,

    // Type 11
    t11StockItems &&
    t11StockItems.length > 0 &&
    t11StockItems.some((i) => i.productName || i.remainingQty || i.remarks)
      ? `รายการตรวจเช็กสต็อก: มีบันทึก ${t11StockItems.length} รายการ`
      : null,
    t11ProductList ? `รายการสินค้าตรวจเช็ก: ${t11ProductList}` : null,
    t11RemainingQty ? `จำนวนคงเหลือสต็อก: ${t11RemainingQty}` : null,
    t11Remarks ? `ข้อสังเกตสต็อก: ${t11Remarks}` : null,
    t11StockStatus ? `สถานะสต็อก: ${t11StockStatus}` : null,
    t11ReorderOpportunity ? `โอกาสสั่งซื้อซ้ำ: ${t11ReorderOpportunity}` : null,
    t11NextAction ? `แผนการติดตามสต็อก: ${t11NextAction}` : null,
  ].filter(Boolean) as string[];

  const t2HasProblem =
    t2UsageResult === "พบปัญหา" ||
    (typeof t2UsageResult === "string" && t2UsageResult.includes("พบปัญหา"));

  const actualSalesPromotionSpent = parseCleanNumber(
    planSummary.salesPromotionBudget,
  );
  const actualMarketingSpent = parseCleanNumber(planSummary.marketingBudget);
  const totalSpent =
    actualSalesPromotionSpent != null || actualMarketingSpent != null
      ? (actualSalesPromotionSpent ?? 0) + (actualMarketingSpent ?? 0)
      : null;

  const salesResult = parseCleanNumber(
    t3ActualSales || t9ActualSales || t10ActualSalesOrBooking,
  );
  const collectResult = parseCleanNumber(t4ReceivedAmount);
  const attendeesCount = parseCleanNumber(
    t8ActualAttendees || t9ActualAttendees || t10ActualAttendees,
  );

  const effectiveDemoPlotId =
    input.t7DemoPlotId === "OTHER"
      ? t7CustomPlotDetail?.trim()
        ? `OTHER:${t7CustomPlotDetail.trim()}`
        : "OTHER"
      : input.t7DemoPlotId || null;

  const hasType7Data =
    Boolean(t7PlotName) ||
    Boolean(t7PlotObjective) ||
    Boolean(t7CustomPlotDetail) ||
    Boolean(t7PlantingDate) ||
    Boolean(t7UsageMethod) ||
    Boolean(t7CropAgeValue) ||
    Boolean(t7GrowthStage) ||
    Boolean(t7CropCondition) ||
    Boolean(t7ProductResponse) ||
    Boolean(input.t7ActualProductId) ||
    Boolean(input.t7PlannedProductId) ||
    Boolean(input.t7DemoPlotId);

  const demoResults = hasType7Data
    ? [
        {
          demoPlotId: effectiveDemoPlotId,
          plannedProductId: input.t7PlannedProductId || null,
          actualProductId:
            input.t7ActualProductId || input.t7PlannedProductId || null,
          changeReason: isT7ProductChanged
            ? input.t7ChangeReason?.trim() || null
            : null,
          plotObjective: t7PlotObjective?.trim() || null,
          cropAgeValue: t7CropAgeValue || null,
          cropAgeUnit: t7CropAgeUnit || null,
          growthStage: t7GrowthStage || null,
          cropCondition: t7CropCondition || null,
          productResponse: t7ProductResponse || null,
          problemDescription: t7ProblemDescription || null,
          finalYieldKg: parseCleanNumber(t7FinalYieldKg),
          controlYieldKg: parseCleanNumber(t7ControlYieldKg),
          satisfactionScore: t7FarmerSatisfaction ?? null,
        },
      ]
    : undefined;

  // Build structured sale results
  const saleResults: any[] = [];
  if (
    input.t3ProductSalesDetails &&
    Array.isArray(input.t3ProductSalesDetails)
  ) {
    input.t3ProductSalesDetails.forEach((d) => {
      const pId = d.productId || d.id;
      const qty = Number(d.actualQty || d.quantity || 0);
      const uPrice = Number(d.unitPrice || d.price || 0);
      const total = Number(d.actualSales || qty * uPrice);
      const reason = d.unclosedReason || input.t3UnclosedReason || null;
      if (pId && (qty > 0 || total > 0 || reason || d.isAdditional)) {
        saleResults.push({
          workTypeCode: "TYPE_3",
          storeId: d.storeId || null,
          productId: pId,
          productName: d.productName || null,
          actualQuantity: qty,
          actualUnitPrice: uPrice,
          actualTotal: total,
          unclosedReason: reason,
          isAdditional: Boolean(d.isAdditional),
        });
      }
    });
  }
  if (
    input.t9ProductSalesDetails &&
    Array.isArray(input.t9ProductSalesDetails)
  ) {
    input.t9ProductSalesDetails.forEach((d) => {
      const pId = d.productId || d.id;
      const qty = Number(d.actualQuantityCases || d.quantityCases || 0);
      const uPrice = Number(d.pricePerCase || 0);
      const total = Number(d.actualSales || qty * uPrice);
      if (pId && (qty > 0 || total > 0)) {
        saleResults.push({
          workTypeCode: "TYPE_9",
          storeId: d.storeId || null,
          productId: pId,
          productName: d.productName || null,
          actualQuantity: qty,
          actualUnitPrice: uPrice,
          actualTotal: total,
        });
      }
    });
  }
  if (
    input.t8ProductSalesDetails &&
    Array.isArray(input.t8ProductSalesDetails)
  ) {
    input.t8ProductSalesDetails.forEach((d) => {
      const pId = d.productId || d.id;
      const qty = Number(d.actualQty || 0);
      const uPrice = Number(d.unitPrice || 0);
      const total = Number(d.actualSales || qty * uPrice);
      if (pId && (qty > 0 || total > 0)) {
        saleResults.push({
          workTypeCode: "TYPE_8",
          storeId: null,
          productId: pId,
          productName: d.productName || null,
          actualQuantity: qty,
          actualUnitPrice: uPrice,
          actualTotal: total,
        });
      }
    });
  }

  // Build structured stock results
  const stockResults: any[] = [];
  if (input.t11StockItems && Array.isArray(input.t11StockItems)) {
    input.t11StockItems.forEach((item) => {
      const sId = item.storeId || (item.store && item.store.id);
      const pId = item.productId || (item.product && item.product.id);
      if (sId && pId) {
        stockResults.push({
          storeId: sId,
          productId: pId,
          remainingQuantity: Number(
            item.remainingQuantity ??
              item.remainingStockQty ??
              item.remainingQty ??
              item.quantity ??
              0,
          ),
          stockStatus: item.stockStatus || null,
          reorderOpportunity: item.reorderOpportunity || null,
          remarks: item.remarks || null,
        });
      }
    });
  }

  // Build structured survey results
  const surveyResults: any[] = [];
  if (input.t5SurveyDetails && Array.isArray(input.t5SurveyDetails)) {
    input.t5SurveyDetails.forEach((item) => {
      const sId = (item as any).storeId || (item as any).id;
      if (sId && (item.competitorBrand || item.competitorProduct)) {
        surveyResults.push({
          storeId: sId,
          productId: (item as any).productId || null,
          competitorBrand: item.competitorBrand || "-",
          competitorProduct: item.competitorProduct || "-",
          competitorPrice: parseCleanNumber(item.competitorPrice),
          competitorUnit: item.competitorUnit || "ขวด",
          promotionDetail: item.promotionDetail || null,
        });
      }
    });
  }

  // Build structured followupResults for TYPE_2
  const followupResults: any[] = [];
  if (input.t2FollowupResults && input.t2FollowupResults.length > 0) {
    input.t2FollowupResults.forEach((item) => {
      if (item.productName && item.productName.trim()) {
        const pId =
          item.productId ||
          (input.products || []).find(
            (p) =>
              p.name.trim().toLowerCase() ===
              item.productName.trim().toLowerCase(),
          )?.id ||
          null;
        const isProblem = item.usageResult === "พบปัญหา";
        if (pId) {
          followupResults.push({
            storeId: item.storeId || null,
            productId: pId,
            productName: item.productName,
            usageResult: isProblem ? "พบปัญหา" : "ลูกค้าพึงพอใจ",
            followupDetail: isProblem ? null : item.followupDetail || null,
            problemDetail: isProblem ? item.problemDetail || null : null,
            isAdditional: Boolean(item.isAdditional),
          });
        }
      }
    });
  }

  // Build structured attachments
  const attachments: any[] = [];
  const addAttachment = (
    img: any,
    workTypeCode: string,
    category: string = "GENERAL",
  ) => {
    if (img && img.url) {
      attachments.push({
        workTypeCode,
        category,
        fileUrl: img.url,
        fileName: img.name || `${workTypeCode.toLowerCase()}_image.jpg`,
        fileSize: img.size || null,
        mimeType: img.type || "image/jpeg",
      });
    }
  };

  (input.t1PlotImages || [])
    .slice(0, 5)
    .forEach((img) => addAttachment(img, "TYPE_1", "PLOT"));
  (input.t2Images || [])
    .slice(0, 5)
    .forEach((img) => addAttachment(img, "TYPE_2"));
  (input.t6Images || []).forEach((img) => addAttachment(img, "TYPE_6"));
  (input.t7CropImages || []).forEach((img) =>
    addAttachment(img, "TYPE_7", "CROP"),
  );
  (input.t7PlotImages || []).forEach((img) =>
    addAttachment(img, "TYPE_7", "PLOT"),
  );
  (input.t8Images || []).forEach((img) => addAttachment(img, "TYPE_8"));
  (input.t9Images || []).forEach((img) => addAttachment(img, "TYPE_9"));
  (input.t10Images || []).forEach((img) => addAttachment(img, "TYPE_10"));

  const payload = {
    actualStartDate: new Date(),
    actualEndDate: new Date(),
    actualAttendeesCount:
      attendeesCount != null ? Math.round(attendeesCount) : null,
    resultStatus: activityResultStatus,
    resultSummary:
      summaryParts.length > 0
        ? summaryParts.join("\n")
        : `สถานะผลกิจกรรม: ${statusLabel}`,
    farmerHomeAddress: input.t1FarmerHomeAddress?.trim() || null,
    plotLatitude: parseCleanNumber(input.t1PlotLatitude),
    plotLongitude: parseCleanNumber(input.t1PlotLongitude),
    discussionResult: t1DiscussionResult || null,
    productAdvice: t1ProductAdvice || null,
    salesOpportunity: t1SalesOpportunity || null,
    problemFound:
      (t2HasProblem ? t2ProblemDetail : null) ||
      t6ProblemDetail ||
      t7ProblemDescription ||
      t7CropProblemDescription ||
      null,
    nextAction: t1NextAction || t11NextAction || null,
    nextMeetingDate: t1NextMeetingDate ? new Date(t1NextMeetingDate) : null,
    cancelReason: activityResultStatus === "CANCELLED" ? cancelReason : null,
    postponedDate:
      activityResultStatus === "POSTPONED" && postponedDate
        ? new Date(postponedDate)
        : null,
    postponedTime:
      activityResultStatus === "POSTPONED" ? postponedTime || null : null,
    postponedReason:
      activityResultStatus === "POSTPONED" ? postponedReason || null : null,
    postponedNotes:
      activityResultStatus === "POSTPONED" ? postponedNotes || null : null,
    actualSalesPromotionSpent,
    actualMarketingSpent,
    actualTotalSpent: totalSpent,
    salesResultAmount: salesResult,
    collectResultAmount: collectResult,
    demoPlotsCreated: t7PlotName ? 1 : 0,
    demoResults,
    saleResults: saleResults.length > 0 ? saleResults : undefined,
    stockResults: stockResults.length > 0 ? stockResults : undefined,
    surveyResults: surveyResults.length > 0 ? surveyResults : undefined,
    followupResults: followupResults.length > 0 ? followupResults : undefined,
    attachments: attachments.length > 0 ? attachments : undefined,
  };

  return {
    summaryParts,
    payload,
  };
}
