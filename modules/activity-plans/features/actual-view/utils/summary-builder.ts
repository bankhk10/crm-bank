import type {
  ActivityResultStatusType,
  PlanSummaryData,
  Type5SurveyRecord,
  ImageFile,
} from "../types";

export interface BuildSummaryInput {
  activityResultStatus: ActivityResultStatusType;
  cancelReason: string;
  postponedDate: string;
  postponedTime: string;
  postponedReason: string;
  postponedNotes: string;

  planSummary: PlanSummaryData;

  // Type 1
  t1ProductAdvice: string;
  t1SalesOpportunity: "สูง" | "ต่ำ" | "";
  t1DiscussionResult: string;
  t1Detail: string;
  t1NextAction: string;
  t1NextMeetingDate: string;

  // Type 2
  t2CustomerName: string;
  t2FollowupDetail: string;
  t2Detail: string;
  t2UsageResult: "พืชตอบสนองดี" | "พบปัญหา" | "";
  t2ProblemDetail: string;

  // Type 3
  t3SoldProducts: string;
  t3ActualSales: string;
  t3ActualQuantity: string;
  t3UnclosedReason: string;
  t3ProductSalesDetails?: any[];

  // Type 4
  t4OrderNo: string;
  t4ReceivedAmount: string;

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
  t7PlotName: string;
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

export function buildResultSummary(input: BuildSummaryInput): BuildSummaryResult {
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
    t3SoldProducts,
    t3ActualSales,
    t3ActualQuantity,
    t3UnclosedReason,
    t3ProductSalesDetails,
    t4OrderNo,
    t4ReceivedAmount,
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
    t7PlotName,
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

  const statusLabel =
    activityResultStatus === "COMPLETED"
      ? "สำเร็จ"
      : activityResultStatus === "POSTPONED"
        ? "เลื่อน"
        : activityResultStatus === "CANCELLED"
          ? "ยกเลิก"
          : "สำเร็จบางส่วน";

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

    // Type 2
    t2CustomerName ? `ลูกค้าติดตาม: ${t2CustomerName}` : null,
    t2FollowupDetail || t2Detail
      ? `ติดตามผล: ${t2FollowupDetail || t2Detail}`
      : null,
    t2UsageResult ? `ผลลัพธ์การใช้: ${t2UsageResult}` : null,
    (t2UsageResult === "พบปัญหา" ||
      (typeof t2UsageResult === "string" && t2UsageResult.includes("พบปัญหา"))) &&
    t2ProblemDetail
      ? `ปัญหาการใช้สินค้า: ${t2ProblemDetail}`
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
      ? `ยอดขายแยกสินค้าเสนอขาย: ${JSON.stringify(t3ProductSalesDetails)}`
      : null,

    // Type 4
    t4OrderNo ? `เลขที่บิล/ใบแจ้งหนี้: ${t4OrderNo}` : null,
    t4ReceivedAmount ? `ยอดเงินที่เก็บได้จริง: ${t4ReceivedAmount}` : null,

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
      ? `รายการสำรวจตลาดคู่แข่ง: ${JSON.stringify(t5SurveyDetails)}`
      : null,

    // Type 6
    t6ProblemDetail ? `ปัญหาลูกค้าร้องเรียน: ${t6ProblemDetail}` : null,
    t6InitialSolution
      ? `แนวทางแก้ไขเบื้องต้น: ${t6InitialSolution}`
      : null,
    t6Status ? `สถานะการแก้ปัญหา: ${t6Status}` : null,
    t6Images && t6Images.length > 0
      ? `รูปภาพปัญหา/การแก้ไข: ${JSON.stringify(t6Images)}`
      : null,

    // Type 7
    t7PlotName ? `ชื่อแปลงทดสอบ: ${t7PlotName}` : null,
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
    t7ControlYieldKg
      ? `ผลผลิตแปลงควบคุม: ${t7ControlYieldKg} กก./ไร่`
      : null,
    t7YieldIncreasePercent
      ? `% ผลผลิตเพิ่มขึ้น: ${t7YieldIncreasePercent}%`
      : null,
    t7FarmerSatisfaction
      ? `ความพึงพอใจเกษตรกร: ${t7FarmerSatisfaction}/5`
      : null,
    t7CommercialPotential
      ? `โอกาสสั่งซื้อจริง: ${t7CommercialPotential}`
      : null,
    t7FinalSummaryNotes
      ? `สรุปผลสัมฤทธิ์แปลง: ${t7FinalSummaryNotes}`
      : null,
    t7CropImages && t7CropImages.length > 0
      ? `รูปภาพสภาพพืช: ${JSON.stringify(t7CropImages)}`
      : null,
    t7PlotImages && t7PlotImages.length > 0
      ? `รูปภาพสภาพแปลง: ${JSON.stringify(t7PlotImages)}`
      : null,

    // Type 8
    t8ActualAttendees
      ? `จำนวนผู้เข้าร่วมประชุมจริง: ${t8ActualAttendees}`
      : null,
    t8FeedbackQnA ? `Q&A: ${t8FeedbackQnA}` : null,
    t8ProductSalesDetails &&
    t8ProductSalesDetails.length > 0 &&
    t8ProductSalesDetails.some((d) => d.actualQty || d.actualSales)
      ? `ยอดขายแยกสินค้าประชุม: ${JSON.stringify(t8ProductSalesDetails)}`
      : null,
    t8Images && t8Images.length > 0
      ? `รูปภาพบรรยากาศการประชุม: ${JSON.stringify(t8Images)}`
      : null,

    // Type 9
    t9ActualSales ? `ยอดขายหน้าร้านจริง: ${t9ActualSales}` : null,
    t9ProductSalesDetails &&
    t9ProductSalesDetails.length > 0 &&
    t9ProductSalesDetails.some((d) => d.actualQuantityCases || d.actualSales)
      ? `ยอดขายแยกสินค้าหน้าร้าน: ${JSON.stringify(t9ProductSalesDetails)}`
      : null,
    t9ActualAttendees
      ? `จำนวนผู้เข้าร่วมกิจกรรมหน้าร้าน: ${t9ActualAttendees}`
      : null,
    t9Images && t9Images.length > 0
      ? `รูปภาพกิจกรรมส่งเสริมการขายหน้าร้าน: ${JSON.stringify(t9Images)}`
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
      ? `รูปภาพบรรยากาศงาน Field Day: ${JSON.stringify(t10Images)}`
      : null,

    // Type 11
    t11StockItems &&
    t11StockItems.length > 0 &&
    t11StockItems.some((i) => i.productName || i.remainingQty || i.remarks)
      ? `รายการตรวจเช็กสต็อก: ${JSON.stringify(t11StockItems)}`
      : null,
    t11ProductList ? `รายการสินค้าตรวจเช็ก: ${t11ProductList}` : null,
    t11RemainingQty ? `จำนวนคงเหลือสต็อก: ${t11RemainingQty}` : null,
    t11Remarks ? `ข้อสังเกตสต็อก: ${t11Remarks}` : null,
    t11StockStatus ? `สถานะสต็อก: ${t11StockStatus}` : null,
    t11ReorderOpportunity
      ? `โอกาสสั่งซื้อซ้ำ: ${t11ReorderOpportunity}`
      : null,
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
    problemFound:
      (t2HasProblem ? t2ProblemDetail : null) ||
      t6ProblemDetail ||
      t7ProblemDescription ||
      t7CropProblemDescription ||
      null,
    nextAction: t1NextAction || t11NextAction || null,
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
  };

  return {
    summaryParts,
    payload,
  };
}
