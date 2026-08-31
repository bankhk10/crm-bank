"use client";

import React from "react";
import { BarChart3 } from "lucide-react";
import { WORK_TYPES } from "@/modules/activity-plans/constants";
import type { ActualTargetsState, ImageFile, Type5SurveyRecord } from "../types";
import {
  ActualType1Visit,
  ActualType2Followup,
  ActualType3Sales,
  ActualType4Collect,
  ActualType5Survey,
  ActualType6Issue,
  ActualType7Demo,
  ActualType8Meeting,
  ActualType9Store,
  ActualType10FieldDay,
  ActualType11Stock,
} from "./work-types";

interface ActivityResultSectionProps {
  isTypeVisible: (typeTitle: string) => boolean;
  targets: ActualTargetsState;
  products: any[];

  createUploadHandler: (
    setter: React.Dispatch<React.SetStateAction<ImageFile[]>>,
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeImage: (
    setter: React.Dispatch<React.SetStateAction<ImageFile[]>>,
    imgId: string,
  ) => void;

  // Type 1
  t1ProductAdvice: string;
  setT1ProductAdvice: (v: string) => void;
  t1Detail: string;
  setT1Detail: (v: string) => void;
  t1DiscussionResult: string;
  setT1DiscussionResult: (v: string) => void;
  t1SalesOpportunity: "สูง" | "ต่ำ" | "";
  setT1SalesOpportunity: (v: "สูง" | "ต่ำ" | "") => void;
  t1NextAction: string;
  setT1NextAction: (v: string) => void;
  t1NextMeetingDate: string;
  setT1NextMeetingDate: (v: string) => void;

  // Type 2
  t2CustomerName: string;
  setT2CustomerName: (v: string) => void;
  t2FollowupDetail: string;
  setT2FollowupDetail: (v: string) => void;
  t2Detail: string;
  setT2Detail: (v: string) => void;
  t2UsageResult: "พืชตอบสนองดี" | "พบปัญหา" | "";
  setT2UsageResult: (v: "พืชตอบสนองดี" | "พบปัญหา" | "") => void;
  t2ProblemDetail: string;
  setT2ProblemDetail: (v: string) => void;

  // Type 3
  t3SoldProducts: string;
  setT3SoldProducts: (v: string) => void;
  t3ActualSales: string;
  setT3ActualSales: (v: string) => void;
  t3ActualQuantity: string;
  setT3ActualQuantity: (v: string) => void;
  t3UnclosedReason: string;
  setT3UnclosedReason: (v: string) => void;
  t3ProductSalesDetails?: any[];
  setT3ProductSalesDetails?: (v: any[]) => void;

  // Type 4
  t4OrderNo: string;
  setT4OrderNo: (v: string) => void;
  t4ReceivedAmount: string;
  setT4ReceivedAmount: (v: string) => void;
  t4PaymentImages: ImageFile[];
  setT4PaymentImages: React.Dispatch<React.SetStateAction<ImageFile[]>>;

  // Type 5
  t5SurveyDetails?: Type5SurveyRecord[];
  onUpdateT5SurveyItem?: (
    index: number,
    updated: Partial<Type5SurveyRecord>,
  ) => void;
  t5CompetitorBrand: string;
  setT5CompetitorBrand: (v: string) => void;
  t5CompetitorProduct: string;
  setT5CompetitorProduct: (v: string) => void;
  t5CompetitorPrice: string;
  setT5CompetitorPrice: (v: string) => void;
  t5CompetitorUnit: string;
  setT5CompetitorUnit: (v: string) => void;
  t5PromotionDetail: string;
  setT5PromotionDetail: (v: string) => void;
  t5PriceTagImages: ImageFile[];
  setT5PriceTagImages: React.Dispatch<React.SetStateAction<ImageFile[]>>;

  // Type 6
  t6ProblemDetail: string;
  setT6ProblemDetail: (v: string) => void;
  t6InitialSolution: string;
  setT6InitialSolution: (v: string) => void;
  t6Status: "เสร็จสิ้น" | "รอติดตาม" | "";
  setT6Status: (v: "เสร็จสิ้น" | "รอติดตาม" | "") => void;
  t6Images: ImageFile[];
  setT6Images: React.Dispatch<React.SetStateAction<ImageFile[]>>;

  // Type 7
  t7StartDate: string;
  t7ProductPrice: number;
  t7PlotName: string;
  setT7PlotName: (v: string) => void;
  t7PlannedProductId?: string | null;
  setT7PlannedProductId?: (v: string | null) => void;
  t7ActualProductId?: string | null;
  setT7ActualProductId?: (v: string | null) => void;
  t7ChangeReason?: string;
  setT7ChangeReason?: (v: string) => void;
  t7UsageMethod: string;
  setT7UsageMethod: (v: string) => void;
  t7PlantingDate: string;
  setT7PlantingDate: (v: string) => void;
  t7PlantingAreaCondition: string;
  setT7PlantingAreaCondition: (v: string) => void;
  t7CropImages: ImageFile[];
  setT7CropImages: React.Dispatch<React.SetStateAction<ImageFile[]>>;
  t7CropAgeValue: string;
  setT7CropAgeValue: (v: string) => void;
  t7CropAgeUnit: string;
  setT7CropAgeUnit: (v: string) => void;
  t7GrowthStage: string;
  setT7GrowthStage: (v: string) => void;
  t7CropCondition: "สมบูรณ์" | "มีปัญหา" | "ปานกลาง" | "ทรุดโทรม" | "";
  setT7CropCondition: (
    v: "สมบูรณ์" | "มีปัญหา" | "ปานกลาง" | "ทรุดโทรม" | "",
  ) => void;
  t7CropProblemDescription: string;
  setT7CropProblemDescription: (v: string) => void;
  t7ProductResponse: "พืชตอบสนองดี" | "พบปัญหา" | "";
  setT7ProductResponse: (v: "พืชตอบสนองดี" | "พบปัญหา" | "") => void;
  t7ProblemDescription: string;
  setT7ProblemDescription: (v: string) => void;
  t7PlotImages: ImageFile[];
  setT7PlotImages: React.Dispatch<React.SetStateAction<ImageFile[]>>;
  t7PlotStatus: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  setT7PlotStatus: (v: "IN_PROGRESS" | "COMPLETED" | "FAILED") => void;
  t7NextFollowUpDate: string;
  setT7NextFollowUpDate: (v: string) => void;
  t7FinalYieldKg: string;
  setT7FinalYieldKg: (v: string) => void;
  t7ControlYieldKg: string;
  setT7ControlYieldKg: (v: string) => void;
  t7YieldIncreasePercent: string;
  setT7YieldIncreasePercent: (v: string) => void;
  t7FarmerSatisfaction: number;
  setT7FarmerSatisfaction: (v: number) => void;
  t7CommercialPotential: string;
  setT7CommercialPotential: (v: string) => void;
  t7FinalSummaryNotes: string;
  setT7FinalSummaryNotes: (v: string) => void;
  t7VisitHistory: any[];
  t7DemoPlotData: any;
  t7DemoPlotId?: string | null;
  setT7DemoPlotId?: (id: string | null) => void;

  // Type 8
  t8ActualAttendees: string;
  setT8ActualAttendees: (v: string) => void;
  t8FeedbackQnA: string;
  setT8FeedbackQnA: (v: string) => void;
  t8ProductSalesDetails: any[];
  setT8ProductSalesDetails: (v: any[]) => void;
  t8Images: ImageFile[];
  setT8Images: React.Dispatch<React.SetStateAction<ImageFile[]>>;

  // Type 9
  t9Formats: string[];
  setT9Formats: (v: string[]) => void;
  t9ActualSales: string;
  setT9ActualSales: (v: string) => void;
  t9ProductSalesDetails: any[];
  setT9ProductSalesDetails: (v: any[]) => void;
  t9ActualAttendees: string;
  setT9ActualAttendees: (v: string) => void;
  t9Images: ImageFile[];
  setT9Images: React.Dispatch<React.SetStateAction<ImageFile[]>>;

  // Type 10
  t10ActualAttendees: string;
  setT10ActualAttendees: (v: string) => void;
  t10ActualSalesOrBooking: string;
  setT10ActualSalesOrBooking: (v: string) => void;
  t10TargetFarmersList: string;
  setT10TargetFarmersList: (v: string) => void;
  t10FarmerFeedback: "สูง" | "กลาง" | "ต่ำ" | "";
  setT10FarmerFeedback: (v: "สูง" | "กลาง" | "ต่ำ" | "") => void;
  t10Images: ImageFile[];
  setT10Images: React.Dispatch<React.SetStateAction<ImageFile[]>>;

  // Type 11
  t11StockItems: any[];
  setT11StockItems: (v: any[]) => void;
  t11ProductList: string;
  setT11ProductList: (v: string) => void;
  t11RemainingQty: string;
  setT11RemainingQty: (v: string) => void;
  t11Remarks: string;
  setT11Remarks: (v: string) => void;
  t11StockStatus: "ใกล้หมด" | "ขาดสต็อก" | "";
  setT11StockStatus: (v: "ใกล้หมด" | "ขาดสต็อก" | "") => void;
  t11ReorderOpportunity: "สูง" | "ต่ำ" | "ยังไม่แน่ใจ" | "";
  setT11ReorderOpportunity: (v: "สูง" | "ต่ำ" | "ยังไม่แน่ใจ" | "") => void;
  t11NextAction: string;
  setT11NextAction: (v: string) => void;
}

export function ActivityResultSection(props: ActivityResultSectionProps) {
  const {
    isTypeVisible,
    targets,
    products,
    createUploadHandler,
    removeImage,
    t1ProductAdvice,
    setT1ProductAdvice,
    t1Detail,
    setT1Detail,
    t1DiscussionResult,
    setT1DiscussionResult,
    t1SalesOpportunity,
    setT1SalesOpportunity,
    t1NextAction,
    setT1NextAction,
    t1NextMeetingDate,
    setT1NextMeetingDate,
    t2CustomerName,
    setT2CustomerName,
    t2FollowupDetail,
    setT2FollowupDetail,
    t2Detail,
    setT2Detail,
    t2UsageResult,
    setT2UsageResult,
    t2ProblemDetail,
    setT2ProblemDetail,
    t3SoldProducts,
    setT3SoldProducts,
    t3ActualSales,
    setT3ActualSales,
    t3ActualQuantity,
    setT3ActualQuantity,
    t3UnclosedReason,
    setT3UnclosedReason,
    t3ProductSalesDetails,
    setT3ProductSalesDetails,
    t4OrderNo,
    setT4OrderNo,
    t4ReceivedAmount,
    setT4ReceivedAmount,
    t4PaymentImages,
    setT4PaymentImages,
    t5SurveyDetails,
    onUpdateT5SurveyItem,
    t5CompetitorBrand,
    setT5CompetitorBrand,
    t5CompetitorProduct,
    setT5CompetitorProduct,
    t5CompetitorPrice,
    setT5CompetitorPrice,
    t5CompetitorUnit,
    setT5CompetitorUnit,
    t5PromotionDetail,
    setT5PromotionDetail,
    t5PriceTagImages,
    setT5PriceTagImages,
    t6ProblemDetail,
    setT6ProblemDetail,
    t6InitialSolution,
    setT6InitialSolution,
    t6Status,
    setT6Status,
    t6Images,
    setT6Images,
    t7StartDate,
    t7ProductPrice,
    t7PlotName,
    setT7PlotName,
    t7PlannedProductId,
    setT7PlannedProductId,
    t7ActualProductId,
    setT7ActualProductId,
    t7ChangeReason,
    setT7ChangeReason,
    t7UsageMethod,
    setT7UsageMethod,
    t7PlantingDate,
    setT7PlantingDate,
    t7PlantingAreaCondition,
    setT7PlantingAreaCondition,
    t7CropImages,
    setT7CropImages,
    t7CropAgeValue,
    setT7CropAgeValue,
    t7CropAgeUnit,
    setT7CropAgeUnit,
    t7GrowthStage,
    setT7GrowthStage,
    t7CropCondition,
    setT7CropCondition,
    t7CropProblemDescription,
    setT7CropProblemDescription,
    t7ProductResponse,
    setT7ProductResponse,
    t7ProblemDescription,
    setT7ProblemDescription,
    t7PlotImages,
    setT7PlotImages,
    t7PlotStatus,
    setT7PlotStatus,
    t7NextFollowUpDate,
    setT7NextFollowUpDate,
    t7FinalYieldKg,
    setT7FinalYieldKg,
    t7ControlYieldKg,
    setT7ControlYieldKg,
    t7YieldIncreasePercent,
    setT7YieldIncreasePercent,
    t7FarmerSatisfaction,
    setT7FarmerSatisfaction,
    t7CommercialPotential,
    setT7CommercialPotential,
    t7FinalSummaryNotes,
    setT7FinalSummaryNotes,
    t7VisitHistory,
    t7DemoPlotData,
    t7DemoPlotId,
    setT7DemoPlotId,
    t8ActualAttendees,
    setT8ActualAttendees,
    t8FeedbackQnA,
    setT8FeedbackQnA,
    t8ProductSalesDetails,
    setT8ProductSalesDetails,
    t8Images,
    setT8Images,
    t9Formats,
    setT9Formats,
    t9ActualSales,
    setT9ActualSales,
    t9ProductSalesDetails,
    setT9ProductSalesDetails,
    t9ActualAttendees,
    setT9ActualAttendees,
    t9Images,
    setT9Images,
    t10ActualAttendees,
    setT10ActualAttendees,
    t10ActualSalesOrBooking,
    setT10ActualSalesOrBooking,
    t10TargetFarmersList,
    setT10TargetFarmersList,
    t10FarmerFeedback,
    setT10FarmerFeedback,
    t10Images,
    setT10Images,
    t11StockItems,
    setT11StockItems,
    t11ProductList,
    setT11ProductList,
    t11RemainingQty,
    setT11RemainingQty,
    t11Remarks,
    setT11Remarks,
    t11StockStatus,
    setT11StockStatus,
    t11ReorderOpportunity,
    setT11ReorderOpportunity,
    t11NextAction,
    setT11NextAction,
  } = props;

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
        <ActualType1Visit
          isVisible={isTypeVisible("เข้าพบร้านค้า / Key Farmer")}
          target={targets.t1}
          productAdvice={t1ProductAdvice}
          setProductAdvice={setT1ProductAdvice}
          detail={t1Detail}
          setDetail={setT1Detail}
          discussionResult={t1DiscussionResult}
          setDiscussionResult={setT1DiscussionResult}
          salesOpportunity={t1SalesOpportunity}
          setSalesOpportunity={setT1SalesOpportunity}
          nextAction={t1NextAction}
          setNextAction={setT1NextAction}
          nextMeetingDate={t1NextMeetingDate}
          setNextMeetingDate={setT1NextMeetingDate}
          products={products}
        />

        {/* WORK TYPE 2 */}
        <ActualType2Followup
          isVisible={isTypeVisible("ติดตามผลการใช้สินค้า")}
          target={targets.t2}
          customerName={t2CustomerName}
          setCustomerName={setT2CustomerName}
          followupDetail={t2FollowupDetail}
          setFollowupDetail={setT2FollowupDetail}
          detail={t2Detail}
          setDetail={setT2Detail}
          usageResult={t2UsageResult}
          setUsageResult={setT2UsageResult}
          problemDetail={t2ProblemDetail}
          setProblemDetail={setT2ProblemDetail}
        />

        {/* WORK TYPE 3 */}
        <ActualType3Sales
          isVisible={isTypeVisible("เสนอขายสินค้า")}
          target={targets.t3}
          soldProducts={t3SoldProducts}
          setSoldProducts={setT3SoldProducts}
          actualSales={t3ActualSales}
          setActualSales={setT3ActualSales}
          actualQuantity={t3ActualQuantity}
          setActualQuantity={setT3ActualQuantity}
          unclosedReason={t3UnclosedReason}
          setUnclosedReason={setT3UnclosedReason}
          productSalesDetails={t3ProductSalesDetails}
          setProductSalesDetails={setT3ProductSalesDetails}
        />

        {/* WORK TYPE 4 */}
        <ActualType4Collect
          isVisible={isTypeVisible("วางบิล / เก็บเงิน")}
          target={targets.t4}
          orderNo={t4OrderNo}
          setOrderNo={setT4OrderNo}
          receivedAmount={t4ReceivedAmount}
          setReceivedAmount={setT4ReceivedAmount}
          paymentImages={t4PaymentImages}
          onUploadImages={createUploadHandler(setT4PaymentImages)}
          onRemoveImage={(id) => removeImage(setT4PaymentImages, id)}
        />

        {/* WORK TYPE 5 */}
        <ActualType5Survey
          isVisible={isTypeVisible("สำรวจตลาดของคู่แข่ง")}
          target={targets.t5}
          surveyDetails={t5SurveyDetails}
          onUpdateSurveyItem={onUpdateT5SurveyItem}
          competitorBrand={t5CompetitorBrand}
          setCompetitorBrand={setT5CompetitorBrand}
          competitorProduct={t5CompetitorProduct}
          setCompetitorProduct={setT5CompetitorProduct}
          competitorPrice={t5CompetitorPrice}
          setCompetitorPrice={setT5CompetitorPrice}
          competitorUnit={t5CompetitorUnit}
          setCompetitorUnit={setT5CompetitorUnit}
          promotionDetail={t5PromotionDetail}
          setPromotionDetail={setT5PromotionDetail}
          priceTagImages={t5PriceTagImages}
          onUploadImages={createUploadHandler(setT5PriceTagImages)}
          onRemoveImage={(id) => removeImage(setT5PriceTagImages, id)}
        />

        {/* WORK TYPE 6 */}
        <ActualType6Issue
          isVisible={isTypeVisible("แก้ปัญหา / รับเรื่องร้องเรียน")}
          target={targets.t6}
          problemDetail={t6ProblemDetail}
          setProblemDetail={setT6ProblemDetail}
          initialSolution={t6InitialSolution}
          setInitialSolution={setT6InitialSolution}
          status={t6Status}
          setStatus={setT6Status}
          images={t6Images}
          setImages={setT6Images}
        />

        {/* WORK TYPE 7 */}
        <ActualType7Demo
          isVisible={isTypeVisible("ติดตามแปลงสาธิต / ทำแปลง")}
          target={targets.t7}
          products={products}
          plannedProductId={t7PlannedProductId}
          setPlannedProductId={setT7PlannedProductId}
          actualProductId={t7ActualProductId}
          setActualProductId={setT7ActualProductId}
          changeReason={t7ChangeReason}
          setChangeReason={setT7ChangeReason}
          startDate={t7StartDate}
          actualDate={new Date().toISOString().split("T")[0]}
          productPrice={t7ProductPrice}
          plotName={t7PlotName}
          setPlotName={setT7PlotName}
          usageMethod={t7UsageMethod}
          setUsageMethod={setT7UsageMethod}
          plantingDate={t7PlantingDate}
          setPlantingDate={setT7PlantingDate}
          plantingAreaCondition={t7PlantingAreaCondition}
          setPlantingAreaCondition={setT7PlantingAreaCondition}
          cropImages={t7CropImages}
          setCropImages={setT7CropImages}
          cropAgeValue={t7CropAgeValue}
          setCropAgeValue={setT7CropAgeValue}
          cropAgeUnit={t7CropAgeUnit}
          setCropAgeUnit={setT7CropAgeUnit}
          growthStage={t7GrowthStage}
          setGrowthStage={setT7GrowthStage}
          cropCondition={t7CropCondition}
          setCropCondition={setT7CropCondition}
          cropProblemDescription={t7CropProblemDescription}
          setCropProblemDescription={setT7CropProblemDescription}
          productResponse={t7ProductResponse}
          setProductResponse={setT7ProductResponse}
          problemDescription={t7ProblemDescription}
          setProblemDescription={setT7ProblemDescription}
          plotImages={t7PlotImages}
          setPlotImages={setT7PlotImages}
          plotStatus={t7PlotStatus}
          setPlotStatus={setT7PlotStatus}
          nextFollowUpDate={t7NextFollowUpDate}
          setNextFollowUpDate={setT7NextFollowUpDate}
          finalYieldKg={t7FinalYieldKg}
          setFinalYieldKg={setT7FinalYieldKg}
          controlYieldKg={t7ControlYieldKg}
          setControlYieldKg={setT7ControlYieldKg}
          yieldIncreasePercent={t7YieldIncreasePercent}
          setYieldIncreasePercent={setT7YieldIncreasePercent}
          farmerSatisfaction={t7FarmerSatisfaction}
          setFarmerSatisfaction={setT7FarmerSatisfaction}
          commercialPotential={t7CommercialPotential}
          setCommercialPotential={setT7CommercialPotential}
          finalSummaryNotes={t7FinalSummaryNotes}
          setFinalSummaryNotes={setT7FinalSummaryNotes}
          visitHistory={t7VisitHistory}
          demoPlotData={t7DemoPlotData}
          demoPlotId={t7DemoPlotId}
          setDemoPlotId={setT7DemoPlotId}
        />

        {/* WORK TYPE 8 */}
        <ActualType8Meeting
          isVisible={isTypeVisible(
            "จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์",
          )}
          target={targets.t8}
          actualAttendees={t8ActualAttendees}
          setActualAttendees={setT8ActualAttendees}
          feedbackQnA={t8FeedbackQnA}
          setFeedbackQnA={setT8FeedbackQnA}
          productSalesDetails={t8ProductSalesDetails}
          setProductSalesDetails={setT8ProductSalesDetails}
          images={t8Images}
          setImages={setT8Images}
        />

        {/* WORK TYPE 9 */}
        <ActualType9Store
          isVisible={isTypeVisible("จัดกิจกรรมส่งเสริมการขายหน้าร้าน")}
          target={targets.t9}
          formats={t9Formats}
          setFormats={setT9Formats}
          actualSales={t9ActualSales}
          setActualSales={setT9ActualSales}
          productSalesDetails={t9ProductSalesDetails}
          setProductSalesDetails={setT9ProductSalesDetails}
          actualAttendees={t9ActualAttendees}
          setActualAttendees={setT9ActualAttendees}
          images={t9Images}
          setImages={setT9Images}
        />

        {/* WORK TYPE 10 */}
        <ActualType10FieldDay
          isVisible={isTypeVisible("จัดงาน Field Day")}
          target={targets.t10}
          actualAttendees={t10ActualAttendees}
          setActualAttendees={setT10ActualAttendees}
          actualSalesOrBooking={t10ActualSalesOrBooking}
          setActualSalesOrBooking={setT10ActualSalesOrBooking}
          targetFarmersList={t10TargetFarmersList}
          setTargetFarmersList={setT10TargetFarmersList}
          farmerFeedback={t10FarmerFeedback}
          setFarmerFeedback={setT10FarmerFeedback}
          images={t10Images}
          setImages={setT10Images}
        />

        {/* WORK TYPE 11 */}
        <ActualType11Stock
          isVisible={isTypeVisible("ตรวจเช็กสต็อกหน้าร้าน")}
          target={targets.t11}
          products={products}
          stockItems={t11StockItems}
          setStockItems={setT11StockItems}
          productList={t11ProductList}
          setProductList={setT11ProductList}
          remainingQty={t11RemainingQty}
          setRemainingQty={setT11RemainingQty}
          remarks={t11Remarks}
          setRemarks={setT11Remarks}
          stockStatus={t11StockStatus}
          setStockStatus={setT11StockStatus}
          reorderOpportunity={t11ReorderOpportunity}
          setReorderOpportunity={setT11ReorderOpportunity}
          nextAction={t11NextAction}
          setNextAction={setT11NextAction}
        />
      </div>
    </div>
  );
}
