import type { ActivityResultStatusType } from "../types";

export interface ParsedSummaryValues {
  // Activity Result Status & Postponed / Cancelled
  activityResultStatus?: ActivityResultStatusType;
  cancelReason?: string;
  postponedDate?: string;
  postponedTime?: string;
  postponedReason?: string;
  postponedNotes?: string;

  // Common/numeric fields
  problemFound?: string;
  nextAction?: string;

  // Type 1
  t1ProductAdvice?: string;
  t1SalesOpportunity?: "สูง" | "ต่ำ";
  t1DiscussionResult?: string;
  t1Detail?: string;
  t1NextAction?: string;
  t1NextMeetingDate?: string;

  // Type 2
  t2CustomerName?: string;
  t2FollowupDetail?: string;
  t2UsageResult?: "พืชตอบสนองดี" | "พบปัญหา";
  t2ProblemDetail?: string;

  // Type 3
  t3SoldProducts?: string;
  t3ActualSales?: string;
  t3ActualQuantity?: string;
  t3UnclosedReason?: string;
  t3ProductSalesDetails?: any[];

  // Type 4
  t4OrderNo?: string;
  t4ReceivedAmount?: string;

  // Type 5
  t5CompetitorBrand?: string;
  t5CompetitorProduct?: string;
  t5CompetitorPrice?: string;
  t5CompetitorUnit?: string;
  t5PromotionDetail?: string;

  // Type 6
  t6ProblemDetail?: string;
  t6InitialSolution?: string;
  t6Status?: "เสร็จสิ้น" | "รอติดตาม";

  // Type 7
  t7PlotName?: string;
  t7UsageMethod?: string;
  t7CropAgeValue?: string;
  t7CropAgeUnit?: string;
  t7GrowthStage?: string;
  t7CropCondition?: "สมบูรณ์" | "มีปัญหา" | "ปานกลาง" | "ทรุดโทรม";
  t7CropProblemDescription?: string;
  t7ProductResponse?: "พืชตอบสนองดี" | "พบปัญหา";
  t7ProblemDescription?: string;
  t7PlantingDate?: string;
  t7PlantingAreaCondition?: string;
  t7PlotStatus?: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  t7NextFollowUpDate?: string;
  t7FinalYieldKg?: string;
  t7ControlYieldKg?: string;
  t7YieldIncreasePercent?: string;
  t7FarmerSatisfaction?: number;
  t7CommercialPotential?: string;
  t7FinalSummaryNotes?: string;

  // Type 8
  t8ActualAttendees?: string;
  t8FeedbackQnA?: string;
  t8ProductSalesDetails?: any[];

  // Type 9
  t9ActualSales?: string;
  t9ProductSalesDetails?: any[];
  t9ActualAttendees?: string;

  // Type 10
  t10ActualAttendees?: string;
  t10ActualSalesOrBooking?: string;
  t10FarmerFeedback?: "สูง" | "ปานกลาง" | "น้อย";
  t10TargetFarmersList?: string;

  // Type 11
  t11StockItems?: any[];
  t11ProductList?: string;
  t11RemainingQty?: string;
  t11Remarks?: string;
  t11StockStatus?: "เพียงพอ" | "ใกล้หมด" | "สินค้าขาดสต็อก";
  t11ReorderOpportunity?: "สูง" | "ต่ำ";
  t11NextAction?: string;
}

export function parseResultSummary(resData: any): ParsedSummaryValues {
  const result: ParsedSummaryValues = {};

  if (!resData) return result;

  if (resData.resultSummary) {
    const summaryText = resData.resultSummary;

    // Type 1
    const adviceMatch = summaryText.match(/สินค้าที่แนะนำ:\s*(.+)/);
    if (adviceMatch && adviceMatch[1]) {
      result.t1ProductAdvice = adviceMatch[1].split("\n")[0].trim();
    }

    const opportunityMatch = summaryText.match(/โอกาสการขาย:\s*(.+)/);
    if (opportunityMatch && opportunityMatch[1]) {
      const oppVal = opportunityMatch[1].split("\n")[0].trim();
      if (oppVal === "สูง" || oppVal === "ต่ำ") {
        result.t1SalesOpportunity = oppVal;
      }
    }

    const discussionMatch = summaryText.match(/ผลการพูดคุย:\s*(.+)/);
    if (discussionMatch && discussionMatch[1]) {
      result.t1DiscussionResult = discussionMatch[1].split("\n")[0].trim();
    }

    const detailMatch = summaryText.match(/รายละเอียดเข้าพบ:\s*(.+)/);
    if (detailMatch && detailMatch[1]) {
      result.t1Detail = detailMatch[1].split("\n")[0].trim();
    }

    const nextActionMatch = summaryText.match(/สิ่งที่ต้องดำเนินการต่อ:\s*(.+)/);
    if (nextActionMatch && nextActionMatch[1]) {
      result.t1NextAction = nextActionMatch[1].split("\n")[0].trim();
    } else if (resData.nextAction) {
      result.t1NextAction = resData.nextAction;
    }

    const nextMeetingMatch = summaryText.match(/วันที่นัดหมายครั้งถัดไป:\s*(.+)/);
    if (nextMeetingMatch && nextMeetingMatch[1]) {
      let val = nextMeetingMatch[1].split("\n")[0].trim();
      if (val.includes("T")) {
        val = val.split("T")[0];
      }
      result.t1NextMeetingDate = val;
    }

    // Type 2 (Followup)
    const customerMatch = summaryText.match(/ลูกค้าติดตาม:\s*(.+)/);
    if (customerMatch && customerMatch[1]) {
      result.t2CustomerName = customerMatch[1].split("\n")[0].trim();
    }

    const followupMatch = summaryText.match(/ติดตามผล:\s*(.+)/);
    if (followupMatch && followupMatch[1]) {
      result.t2FollowupDetail = followupMatch[1].split("\n")[0].trim();
    }

    const usageResultMatch = summaryText.match(/ผลลัพธ์การใช้:\s*(.+)/);
    if (usageResultMatch && usageResultMatch[1]) {
      const resVal = usageResultMatch[1].split("\n")[0].trim();
      result.t2UsageResult = resVal as any;
      if (resVal === "พืชตอบสนองดี") {
        result.t2ProblemDetail = "";
      }
    }

    const problemMatch = summaryText.match(/ปัญหาการใช้สินค้า:\s*(.+)/);
    if (problemMatch && problemMatch[1]) {
      result.t2ProblemDetail = problemMatch[1].split("\n")[0].trim();
    }

    // Type 3
    const soldMatch = summaryText.match(/รายการขาย:\s*(.+)/);
    if (soldMatch && soldMatch[1]) {
      result.t3SoldProducts = soldMatch[1].split("\n")[0].trim();
    }
    const actualSalesMatch = summaryText.match(/ยอดขายจริง:\s*(.+)/);
    if (actualSalesMatch && actualSalesMatch[1]) {
      result.t3ActualSales = actualSalesMatch[1].split("\n")[0].trim();
    } else if (resData.salesResultAmount) {
      result.t3ActualSales = String(resData.salesResultAmount);
    }
    const actualQtyMatch = summaryText.match(/จำนวนที่ขายจริง:\s*(.+)/);
    if (actualQtyMatch && actualQtyMatch[1]) {
      result.t3ActualQuantity = actualQtyMatch[1].split("\n")[0].trim();
    }
    const unclosedMatch = summaryText.match(/เหตุผลที่ปิดการขายไม่ได้:\s*(.+)/);
    if (unclosedMatch && unclosedMatch[1]) {
      result.t3UnclosedReason = unclosedMatch[1].split("\n")[0].trim();
    }

    const t3DetailsMatch = summaryText.match(/ยอดขายแยกสินค้าเสนอขาย:\s*(.+)/);
    if (t3DetailsMatch && t3DetailsMatch[1]) {
      try {
        const rawJson = t3DetailsMatch[1].split("\n")[0].trim();
        const parsed = JSON.parse(rawJson);
        if (Array.isArray(parsed)) {
          result.t3ProductSalesDetails = parsed;
        }
      } catch (e) {
        console.error("Failed to parse t3ProductSalesDetails", e);
      }
    }

    // Type 4
    const orderNoMatch = summaryText.match(/เลขที่บิล\/ใบแจ้งหนี้:\s*(.+)/);
    if (orderNoMatch && orderNoMatch[1]) {
      result.t4OrderNo = orderNoMatch[1].split("\n")[0].trim();
    }
    const receivedMatch = summaryText.match(/ยอดเงินที่เก็บได้จริง:\s*(.+)/);
    if (receivedMatch && receivedMatch[1]) {
      result.t4ReceivedAmount = receivedMatch[1].split("\n")[0].trim();
    } else if (resData.collectResultAmount) {
      result.t4ReceivedAmount = String(resData.collectResultAmount);
    }

    // Type 5
    const compBrandMatch = summaryText.match(/แบรนด์คู่แข่ง:\s*(.+)/);
    if (compBrandMatch && compBrandMatch[1]) {
      result.t5CompetitorBrand = compBrandMatch[1].split("\n")[0].trim();
    }
    const compProdMatch = summaryText.match(/สินค้าคู่แข่ง:\s*(.+)/);
    if (compProdMatch && compProdMatch[1]) {
      result.t5CompetitorProduct = compProdMatch[1].split("\n")[0].trim();
    }
    const compPriceMatch = summaryText.match(/ราคาคู่แข่ง:\s*(.+)/);
    if (compPriceMatch && compPriceMatch[1]) {
      result.t5CompetitorPrice = compPriceMatch[1].split("\n")[0].trim();
    }
    const compUnitMatch = summaryText.match(/(?:หน่วยนับคู่แข่ง|หน่วยนับ):\s*(.+)/);
    if (compUnitMatch && compUnitMatch[1]) {
      result.t5CompetitorUnit = compUnitMatch[1].split("\n")[0].trim();
    }
    const promoMatch = summaryText.match(/โปรโมชันคู่แข่ง:\s*(.+)/);
    if (promoMatch && promoMatch[1]) {
      result.t5PromotionDetail = promoMatch[1].split("\n")[0].trim();
    }

    // Type 6
    const t6ProbMatch = summaryText.match(/ปัญหาลูกค้าร้องเรียน:\s*(.+)/);
    if (t6ProbMatch && t6ProbMatch[1]) {
      result.t6ProblemDetail = t6ProbMatch[1].split("\n")[0].trim();
    }
    const t6SolMatch = summaryText.match(/แนวทางแก้ไขเบื้องต้น:\s*(.+)/);
    if (t6SolMatch && t6SolMatch[1]) {
      result.t6InitialSolution = t6SolMatch[1].split("\n")[0].trim();
    }
    const t6StatusMatch = summaryText.match(/สถานะการแก้ปัญหา:\s*(.+)/);
    if (t6StatusMatch && t6StatusMatch[1]) {
      const sVal = t6StatusMatch[1].split("\n")[0].trim();
      if (sVal === "เสร็จสิ้น" || sVal === "รอติดตาม") result.t6Status = sVal;
    }

    // Type 7
    const t7PlotMatch = summaryText.match(/ชื่อแปลงทดสอบ:\s*(.+)/);
    if (t7PlotMatch && t7PlotMatch[1]) {
      result.t7PlotName = t7PlotMatch[1].split("\n")[0].trim();
    }
    const t7MethodMatch = summaryText.match(/วิธีใช้\/อัตราการใช้:\s*(.+)/);
    if (t7MethodMatch && t7MethodMatch[1]) {
      result.t7UsageMethod = t7MethodMatch[1].split("\n")[0].trim();
    }
    const t7AgeMatch = summaryText.match(/อายุพืช:\s*(\d+)\s*(วัน|สัปดาห์|เดือน|ปี)?/);
    if (t7AgeMatch && t7AgeMatch[1]) {
      result.t7CropAgeValue = t7AgeMatch[1].trim();
      if (t7AgeMatch[2]) {
        result.t7CropAgeUnit = t7AgeMatch[2].trim();
      }
    }
    const t7GrowthMatch = summaryText.match(/ระยะการเจริญเติบโต:\s*(.+)/);
    if (t7GrowthMatch && t7GrowthMatch[1]) {
      result.t7GrowthStage = t7GrowthMatch[1].split("\n")[0].trim();
    }
    const t7CondMatch = summaryText.match(/สภาพแปลง:\s*(.+)/);
    if (t7CondMatch && t7CondMatch[1]) {
      const cVal = t7CondMatch[1].split("\n")[0].trim();
      if (
        cVal === "สมบูรณ์" ||
        cVal === "มีปัญหา" ||
        cVal === "ปานกลาง" ||
        cVal === "ทรุดโทรม"
      ) {
        result.t7CropCondition = cVal as any;
      }
    }
    const t7DescMatch = summaryText.match(/(?:ปัญหาของสภาพพืช|รายละเอียดแปลง):\s*(.+)/);
    if (t7DescMatch && t7DescMatch[1]) {
      result.t7CropProblemDescription = t7DescMatch[1].split("\n")[0].trim();
    }
    const t7ResponseMatch = summaryText.match(/ผลการใช้ผลิตภัณฑ์:\s*(.+)/);
    if (t7ResponseMatch && t7ResponseMatch[1]) {
      const resp = t7ResponseMatch[1].split("\n")[0].trim();
      if (resp === "พืชตอบสนองดี" || resp === "พบปัญหา") {
        result.t7ProductResponse = resp;
      }
    }
    const t7ProblemMatch = summaryText.match(/รายละเอียดปัญหาการใช้ผลิตภัณฑ์:\s*(.+)/);
    if (t7ProblemMatch && t7ProblemMatch[1]) {
      result.t7ProblemDescription = t7ProblemMatch[1].split("\n")[0].trim();
    }
    const plantingDateMatch = summaryText.match(/วันที่ปลูก:\s*(.+)/);
    if (plantingDateMatch && plantingDateMatch[1]) {
      result.t7PlantingDate = plantingDateMatch[1].split("\n")[0].trim();
    }
    const areaCondMatch = summaryText.match(/สภาพพื้นที่ปลูก:\s*(.+)/);
    if (areaCondMatch && areaCondMatch[1]) {
      result.t7PlantingAreaCondition = areaCondMatch[1].split("\n")[0].trim();
    }
    const statusMatch = summaryText.match(/สถานะแปลง:\s*(.+)/);
    if (statusMatch && statusMatch[1]) {
      const s = statusMatch[1].split("\n")[0].trim();
      if (s === "IN_PROGRESS" || s === "COMPLETED" || s === "FAILED") {
        result.t7PlotStatus = s as any;
      }
    }
    const nextVisitMatch = summaryText.match(/กำหนดการติดตามครั้งถัดไป:\s*(.+)/);
    if (nextVisitMatch && nextVisitMatch[1]) {
      result.t7NextFollowUpDate = nextVisitMatch[1].split("\n")[0].trim();
    }
    const yieldMatch = summaryText.match(/ผลผลิตแปลงสาธิต:\s*(.+)/);
    if (yieldMatch && yieldMatch[1]) {
      result.t7FinalYieldKg = yieldMatch[1].replace(/[^0-9.]/g, "");
    }
    const controlMatch = summaryText.match(/ผลผลิตแปลงควบคุม:\s*(.+)/);
    if (controlMatch && controlMatch[1]) {
      result.t7ControlYieldKg = controlMatch[1].replace(/[^0-9.]/g, "");
    }
    const incMatch = summaryText.match(/%\s*ผลผลิตเพิ่มขึ้น:\s*(.+)/);
    if (incMatch && incMatch[1]) {
      result.t7YieldIncreasePercent = incMatch[1].replace(/[^0-9.]/g, "");
    }
    const satMatch = summaryText.match(/ความพึงพอใจเกษตรกร:\s*(\d)/);
    if (satMatch && satMatch[1]) {
      result.t7FarmerSatisfaction = parseInt(satMatch[1]) || 5;
    }
    const comMatch = summaryText.match(/โอกาสสั่งซื้อจริง:\s*(.+)/);
    if (comMatch && comMatch[1]) {
      result.t7CommercialPotential = comMatch[1].split("\n")[0].trim();
    }
    const finalNotesMatch = summaryText.match(/สรุปผลสัมฤทธิ์แปลง:\s*(.+)/);
    if (finalNotesMatch && finalNotesMatch[1]) {
      result.t7FinalSummaryNotes = finalNotesMatch[1].split("\n")[0].trim();
    }

    // Type 8
    const t8AttendeesMatch = summaryText.match(/จำนวนผู้เข้าร่วมประชุมจริง:\s*(.+)/);
    if (t8AttendeesMatch && t8AttendeesMatch[1]) {
      result.t8ActualAttendees = t8AttendeesMatch[1].split("\n")[0].trim();
    }
    const qnaMatch = summaryText.match(/Q&A:\s*(.+)/);
    if (qnaMatch && qnaMatch[1]) {
      result.t8FeedbackQnA = qnaMatch[1].split("\n")[0].trim();
    }
    const t8SalesMatch = summaryText.match(/ยอดขายแยกสินค้าประชุม:\s*(.+)/);
    if (t8SalesMatch && t8SalesMatch[1]) {
      try {
        const parsed = JSON.parse(t8SalesMatch[1].trim());
        if (Array.isArray(parsed)) {
          result.t8ProductSalesDetails = parsed;
        }
      } catch (e) {
        console.error("Failed to parse t8ProductSalesDetails", e);
      }
    }

    // Type 9
    const t9SalesMatch = summaryText.match(/ยอดขายหน้าร้านจริง:\s*(.+)/);
    if (t9SalesMatch && t9SalesMatch[1]) {
      result.t9ActualSales = t9SalesMatch[1].split("\n")[0].trim();
    }
    const t9ProductsMatch = summaryText.match(/ยอดขายแยกสินค้าหน้าร้าน:\s*(.+)/);
    if (t9ProductsMatch && t9ProductsMatch[1]) {
      try {
        const parsed = JSON.parse(t9ProductsMatch[1].trim());
        if (Array.isArray(parsed)) {
          result.t9ProductSalesDetails = parsed;
        }
      } catch (e) {
        console.error("Failed to parse t9ProductSalesDetails", e);
      }
    }
    const t9AttendeesMatch = summaryText.match(/จำนวนผู้เข้าร่วมกิจกรรมหน้าร้าน:\s*(.+)/);
    if (t9AttendeesMatch && t9AttendeesMatch[1]) {
      result.t9ActualAttendees = t9AttendeesMatch[1].split("\n")[0].trim();
    }

    // Type 10
    const t10AttendeesMatch = summaryText.match(/จำนวนผู้เข้าร่วม Field Day จริง:\s*(.+)/);
    if (t10AttendeesMatch && t10AttendeesMatch[1]) {
      result.t10ActualAttendees = t10AttendeesMatch[1].split("\n")[0].trim();
    } else if (
      resData.actualAttendeesCount != null &&
      Number(resData.actualAttendeesCount) > 0
    ) {
      result.t10ActualAttendees = String(resData.actualAttendeesCount);
    }

    const t10SalesMatch = summaryText.match(/ยอดขายหรือยอดจอง Field Day จริง:\s*(.+)/);
    if (t10SalesMatch && t10SalesMatch[1]) {
      result.t10ActualSalesOrBooking = t10SalesMatch[1].split("\n")[0].trim();
    } else if (
      resData.salesResultAmount != null &&
      Number(resData.salesResultAmount) > 0
    ) {
      result.t10ActualSalesOrBooking = String(Number(resData.salesResultAmount));
    }

    const t10FeedbackMatch = summaryText.match(/ความสนใจเกษตรกร:\s*(.+)/);
    if (t10FeedbackMatch && t10FeedbackMatch[1]) {
      result.t10FarmerFeedback = t10FeedbackMatch[1].split("\n")[0].trim() as any;
    }
    const t10FarmersMatch = summaryText.match(/รายชื่อเกษตรกรเป้าหมาย:\s*(.+)/);
    if (t10FarmersMatch && t10FarmersMatch[1]) {
      result.t10TargetFarmersList = t10FarmersMatch[1].split("\n")[0].trim();
    }

    // Type 11
    const t11StockItemsMatch = summaryText.match(/รายการตรวจเช็กสต็อก:\s*(.+)/);
    if (t11StockItemsMatch && t11StockItemsMatch[1]) {
      try {
        const parsed = JSON.parse(t11StockItemsMatch[1].trim());
        if (Array.isArray(parsed) && parsed.length > 0) {
          result.t11StockItems = parsed;
        }
      } catch (e) {
        console.error("Failed to parse t11StockItems", e);
      }
    }
    const t11ProductMatch = summaryText.match(/รายการสินค้าตรวจเช็ก:\s*(.+)/);
    if (t11ProductMatch && t11ProductMatch[1]) {
      result.t11ProductList = t11ProductMatch[1].split("\n")[0].trim();
    }
    const t11QtyMatch = summaryText.match(/จำนวนคงเหลือสต็อก:\s*(.+)/);
    if (t11QtyMatch && t11QtyMatch[1]) {
      result.t11RemainingQty = t11QtyMatch[1].split("\n")[0].trim();
    }
    const t11RemarksMatch = summaryText.match(/ข้อสังเกตสต็อก:\s*(.+)/);
    if (t11RemarksMatch && t11RemarksMatch[1]) {
      result.t11Remarks = t11RemarksMatch[1].split("\n")[0].trim();
    }
    const t11StatusMatch = summaryText.match(/สถานะสต็อก:\s*(.+)/);
    if (t11StatusMatch && t11StatusMatch[1]) {
      result.t11StockStatus = t11StatusMatch[1].split("\n")[0].trim() as any;
    }
    const t11ReorderMatch = summaryText.match(/โอกาสสั่งซื้อซ้ำ:\s*(.+)/);
    if (t11ReorderMatch && t11ReorderMatch[1]) {
      result.t11ReorderOpportunity = t11ReorderMatch[1].split("\n")[0].trim() as any;
    }
    const t11NextActionMatch = summaryText.match(/แผนการติดตามสต็อก:\s*(.+)/);
    if (t11NextActionMatch && t11NextActionMatch[1]) {
      result.t11NextAction = t11NextActionMatch[1].split("\n")[0].trim();
    }
  }

  // Activity Result Status & Postponed / Cancelled fields
  if (resData.resultStatus) {
    result.activityResultStatus = resData.resultStatus as any;
  }
  if (resData.cancelReason) {
    result.cancelReason = resData.cancelReason;
  }
  if (resData.postponedDate) {
    const d = new Date(resData.postponedDate);
    result.postponedDate = !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : "";
  }
  if (resData.postponedTime) {
    result.postponedTime = resData.postponedTime;
  }
  if (resData.postponedReason) {
    result.postponedReason = resData.postponedReason;
  }
  if (resData.postponedNotes) {
    result.postponedNotes = resData.postponedNotes;
  }

  // Numeric and common fields from result
  if (resData.salesResultAmount) {
    result.t3ActualSales = String(Number(resData.salesResultAmount));
    result.t9ActualSales = String(Number(resData.salesResultAmount));
  }
  if (resData.collectResultAmount) {
    result.t4ReceivedAmount = String(Number(resData.collectResultAmount));
  }
  if (resData.actualAttendeesCount) {
    result.t8ActualAttendees = String(resData.actualAttendeesCount);
    result.t9ActualAttendees = String(resData.actualAttendeesCount);
    result.t10ActualAttendees = String(resData.actualAttendeesCount);
  }
  if (resData.problemFound) {
    result.problemFound = resData.problemFound;
  }
  if (resData.nextAction) {
    result.nextAction = resData.nextAction;
  }

  return result;
}
