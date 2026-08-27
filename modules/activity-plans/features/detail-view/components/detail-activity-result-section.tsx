"use client";

import React from "react";
import { BarChart3 } from "lucide-react";
import type { ActualTargetsState } from "../../actual-view/types";
import type { ParsedSummaryValues } from "../../actual-view/utils/summary-parser";
import { WORK_TYPES } from "@/modules/activity-plans/constants";
import {
  DetailType1Visit,
  DetailType2Followup,
  DetailType3Sales,
  DetailType4Collect,
  DetailType5Survey,
  DetailType6Issue,
  DetailType7Demo,
  DetailType8Meeting,
  DetailType9Store,
  DetailType10FieldDay,
  DetailType11Stock,
} from "./work-types";

interface DetailActivityResultSectionProps {
  isTypeVisible: (typeTitle: string) => boolean;
  targets: ActualTargetsState;
  parsedResults: ParsedSummaryValues;
  demoPlotData?: any;
  visitHistory?: any[];
}

export function DetailActivityResultSection({
  isTypeVisible,
  targets,
  parsedResults,
  demoPlotData,
  visitHistory = [],
}: DetailActivityResultSectionProps) {
  const hasAnyActualWorkType = WORK_TYPES.slice(0, 11).some((wt) =>
    isTypeVisible(wt),
  );
  if (!hasAnyActualWorkType) return null;

  return (
    <div className="space-y-4 pt-2">
      <div className="bg-[#eff6ff] border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-2.5 shadow-2xs">
        <BarChart3 className="w-4 h-4 text-blue-600 shrink-0" />
        <h2 className="text-sm font-bold text-blue-900">
          ผลการปฏิบัติงานตามประเภทงาน
        </h2>
      </div>

      <div className="space-y-4 md:space-y-6">
        {/* WORK TYPE 1 */}
        <DetailType1Visit
          isVisible={isTypeVisible("เข้าพบร้านค้า / Key Farmer")}
          target={targets.t1}
          productAdvice={parsedResults.t1ProductAdvice}
          discussionResult={parsedResults.t1DiscussionResult}
          salesOpportunity={parsedResults.t1SalesOpportunity}
          nextAction={parsedResults.t1NextAction}
          nextMeetingDate={parsedResults.t1NextMeetingDate}
        />

        {/* WORK TYPE 2 */}
        <DetailType2Followup
          isVisible={isTypeVisible("ติดตามผลการใช้สินค้า")}
          target={targets.t2}
          customerName={parsedResults.t2CustomerName}
          followupDetail={parsedResults.t2FollowupDetail}
          detail={parsedResults.t2FollowupDetail}
          usageResult={parsedResults.t2UsageResult}
          problemDetail={parsedResults.t2ProblemDetail}
        />

        {/* WORK TYPE 3 */}
        <DetailType3Sales
          isVisible={isTypeVisible("เสนอขายสินค้า")}
          target={targets.t3}
          soldProducts={parsedResults.t3SoldProducts}
          actualSales={parsedResults.t3ActualSales}
          actualQuantity={parsedResults.t3ActualQuantity}
          unclosedReason={parsedResults.t3UnclosedReason}
          productSalesDetails={parsedResults.t3ProductSalesDetails}
        />

        {/* WORK TYPE 4 */}
        <DetailType4Collect
          isVisible={isTypeVisible("วางบิล / เก็บเงิน")}
          target={targets.t4}
          orderNo={parsedResults.t4OrderNo}
          receivedAmount={parsedResults.t4ReceivedAmount}
        />

        {/* WORK TYPE 5 */}
        <DetailType5Survey
          isVisible={isTypeVisible("สำรวจตลาดของคู่แข่ง")}
          target={targets.t5}
          surveyDetails={parsedResults.t5SurveyDetails}
          competitorBrand={parsedResults.t5CompetitorBrand}
          competitorProduct={parsedResults.t5CompetitorProduct}
          competitorPrice={parsedResults.t5CompetitorPrice}
          competitorUnit={parsedResults.t5CompetitorUnit}
          promotionDetail={parsedResults.t5PromotionDetail}
        />

        {/* WORK TYPE 6 */}
        <DetailType6Issue
          isVisible={isTypeVisible("แก้ปัญหา / รับเรื่องร้องเรียน")}
          target={targets.t6}
          problemDetail={parsedResults.t6ProblemDetail || parsedResults.problemFound}
          initialSolution={parsedResults.t6InitialSolution}
          status={parsedResults.t6Status}
          images={parsedResults.t6Images}
        />

        {/* WORK TYPE 7 */}
        <DetailType7Demo
          isVisible={isTypeVisible("ติดตามแปลงสาธิต / ทำแปลง")}
          target={targets.t7}
          plotName={parsedResults.t7PlotName}
          usageMethod={parsedResults.t7UsageMethod}
          plantingDate={parsedResults.t7PlantingDate}
          plantingAreaCondition={parsedResults.t7PlantingAreaCondition}
          cropAgeValue={parsedResults.t7CropAgeValue}
          cropAgeUnit={parsedResults.t7CropAgeUnit}
          growthStage={parsedResults.t7GrowthStage}
          cropCondition={parsedResults.t7CropCondition}
          cropProblemDescription={parsedResults.t7CropProblemDescription}
          productResponse={parsedResults.t7ProductResponse}
          problemDescription={parsedResults.t7ProblemDescription}
          plotStatus={parsedResults.t7PlotStatus}
          nextFollowUpDate={parsedResults.t7NextFollowUpDate}
          finalYieldKg={parsedResults.t7FinalYieldKg}
          controlYieldKg={parsedResults.t7ControlYieldKg}
          yieldIncreasePercent={parsedResults.t7YieldIncreasePercent}
          farmerSatisfaction={parsedResults.t7FarmerSatisfaction}
          commercialPotential={parsedResults.t7CommercialPotential}
          finalSummaryNotes={parsedResults.t7FinalSummaryNotes}
          cropImages={parsedResults.t7CropImages}
          plotImages={parsedResults.t7PlotImages}
          demoPlotData={demoPlotData}
          visitHistory={visitHistory}
        />

        {/* WORK TYPE 8 */}
        <DetailType8Meeting
          isVisible={isTypeVisible(
            "จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์",
          )}
          target={targets.t8}
          actualAttendees={parsedResults.t8ActualAttendees}
          feedbackQnA={parsedResults.t8FeedbackQnA}
          productSalesDetails={parsedResults.t8ProductSalesDetails}
          images={parsedResults.t8Images}
        />

        {/* WORK TYPE 9 */}
        <DetailType9Store
          isVisible={isTypeVisible("จัดกิจกรรมส่งเสริมการขายหน้าร้าน")}
          target={targets.t9}
          actualSales={parsedResults.t9ActualSales}
          productSalesDetails={parsedResults.t9ProductSalesDetails}
          actualAttendees={parsedResults.t9ActualAttendees}
          images={parsedResults.t9Images}
        />

        {/* WORK TYPE 10 */}
        <DetailType10FieldDay
          isVisible={isTypeVisible("จัดงาน Field Day")}
          target={targets.t10}
          actualAttendees={parsedResults.t10ActualAttendees}
          actualSalesOrBooking={parsedResults.t10ActualSalesOrBooking}
          targetFarmersList={parsedResults.t10TargetFarmersList}
          farmerFeedback={
            parsedResults.t10FarmerFeedback === "น้อย"
              ? "ต่ำ"
              : parsedResults.t10FarmerFeedback === "ปานกลาง"
                ? "กลาง"
                : parsedResults.t10FarmerFeedback
          }
          images={parsedResults.t10Images}
        />

        {/* WORK TYPE 11 */}
        <DetailType11Stock
          isVisible={isTypeVisible("ตรวจเช็กสต็อกหน้าร้าน")}
          target={targets.t11}
          stockItems={parsedResults.t11StockItems}
          productList={parsedResults.t11ProductList}
          remainingQty={parsedResults.t11RemainingQty}
          remarks={parsedResults.t11Remarks}
          stockStatus={
            parsedResults.t11StockStatus === "สินค้าขาดสต็อก"
              ? "ขาดสต็อก"
              : parsedResults.t11StockStatus === "ใกล้หมด"
                ? "ใกล้หมด"
                : ""
          }
          reorderOpportunity={parsedResults.t11ReorderOpportunity}
          nextAction={parsedResults.t11NextAction || parsedResults.nextAction}
        />
      </div>
    </div>
  );
}
