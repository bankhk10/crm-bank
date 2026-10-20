"use client";

import React from "react";
import {
  Type1ActualForm,
  type Type1TargetItem,
  type useType1Actual,
} from "@/modules/activity/features/type-1";
import {
  Type2ActualForm,
  type Type2TargetItem,
  type useType2Actual,
} from "@/modules/activity/features/type-2";
import {
  Type3ActualForm,
  type Type3TargetItem,
  type useType3Actual,
} from "@/modules/activity/features/type-3";
import {
  Type4ActualForm,
  type Type4TargetItem,
  type useType4Actual,
} from "@/modules/activity/features/type-4";
import {
  Type5ActualForm,
  type Type5TargetItem,
  type useType5Actual,
} from "@/modules/activity/features/type-5";
import {
  Type6ActualForm,
  type Type6TargetItem,
  type useType6Actual,
} from "@/modules/activity/features/type-6";
import {
  Type7aActualForm,
  type Type7aTargetItem,
  type useType7aActual,
} from "@/modules/activity/features/type-7a";
import {
  Type7bActualForm,
  type Type7bTargetItem,
  type useType7bActual,
} from "@/modules/activity/features/type-7b";

interface ActualWorkTypeListProps {
  planWorkTypes: string[];
  type1State: ReturnType<typeof useType1Actual>;
  type2State?: ReturnType<typeof useType2Actual>;
  type3State?: ReturnType<typeof useType3Actual>;
  type4State?: ReturnType<typeof useType4Actual>;
  type5State?: ReturnType<typeof useType5Actual>;
  type6State?: ReturnType<typeof useType6Actual>;
  type7aState?: ReturnType<typeof useType7aActual>;
  type7bState?: ReturnType<typeof useType7bActual>;
  targets: Type1TargetItem[];
  type2Targets?: Type2TargetItem[];
  type3Targets?: Type3TargetItem[];
  type4Targets?: Type4TargetItem[];
  type5Targets?: Type5TargetItem[];
  type6Targets?: Type6TargetItem[];
  type7aTargets?: Type7aTargetItem[];
  type7bTargets?: Type7bTargetItem[];
  plan?: any;
  products?: any[];
  customers?: any[];
}

/**
 * Component กลางสำหรับรวบรวมและกระจายฟอร์มผลการปฏิบัติงานจริงตามประเภทงาน (Work Types 1 - 14)
 * สอดคล้องกับ DetailWorkTypeList และ ApprovalWorkTypeList
 */
export function ActualWorkTypeList({
  planWorkTypes,
  type1State,
  type2State,
  type3State,
  type4State,
  type5State,
  type6State,
  type7aState,
  type7bState,
  targets,
  type2Targets = [],
  type3Targets = [],
  type4Targets = [],
  type5Targets = [],
  type6Targets = [],
  type7aTargets = [],
  type7bTargets = [],
  plan,
  products = [],
  customers = [],
}: ActualWorkTypeListProps) {
  const isType1Active =
    planWorkTypes.includes("TYPE_1") ||
    planWorkTypes.includes("VISIT") ||
    planWorkTypes.includes("เข้าพบร้านค้า / Key Farmer") ||
    Boolean(plan?.type1Stores?.length) ||
    Boolean(
      plan?.stores?.some(
        (s: any) =>
          s.workTypeCode === "TYPE_1" || s.workTypeCode === "VISIT",
      ),
    ) ||
    plan?.activityType?.code === "TYPE_1";

  const isType2Active =
    planWorkTypes.includes("TYPE_2") ||
    planWorkTypes.includes("ติดตามผลการใช้สินค้า") ||
    planWorkTypes.includes("ติดตามผล") ||
    Boolean(plan?.type2Targets?.length);

  const isType3Active =
    planWorkTypes.includes("TYPE_3") ||
    planWorkTypes.includes("เสนอขายสินค้า") ||
    planWorkTypes.includes("เสนอขาย") ||
    Boolean(plan?.type3Targets?.length);

  const isType4Active =
    planWorkTypes.includes("TYPE_4") ||
    planWorkTypes.includes("วางบิล / เก็บเงิน") ||
    planWorkTypes.includes("วางบิล") ||
    planWorkTypes.includes("เก็บเงิน") ||
    Boolean(plan?.type4Targets?.length);

  const isType5Active =
    planWorkTypes.includes("TYPE_5") ||
    planWorkTypes.includes("สำรวจตลาดของคู่แข่ง") ||
    planWorkTypes.includes("สำรวจตลาด") ||
    Boolean(plan?.type5Targets?.length);

  const isType6Active =
    planWorkTypes.includes("TYPE_6") ||
    planWorkTypes.includes("ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา") ||
    planWorkTypes.includes("ร้องเรียน") ||
    planWorkTypes.includes("แก้ปัญหา") ||
    Boolean(plan?.type6Targets?.length);

  const isType7aActive =
    planWorkTypes.includes("TYPE_7A") ||
    planWorkTypes.includes("จัดทำแปลงสาธิต") ||
    (planWorkTypes.includes("แปลงสาธิต") && !planWorkTypes.includes("ติดตาม")) ||
    Boolean(plan?.type7aPlots?.length) ||
    Boolean(
      plan?.stores?.some(
        (s: any) => s.workTypeCode === "TYPE_7A",
      ),
    ) ||
    plan?.activityType?.code === "TYPE_7A";

  const isType7bActive =
    planWorkTypes.includes("TYPE_7B") ||
    planWorkTypes.includes("ติดตามแปลงสาธิต") ||
    Boolean(plan?.type7bPlots?.length) ||
    Boolean(plan?.type7bData) ||
    Boolean(plan?.type7b) ||
    Boolean(
      plan?.stores?.some(
        (s: any) => s.workTypeCode === "TYPE_7B",
      ),
    ) ||
    plan?.activityType?.code === "TYPE_7B";

  return (
    <div className="space-y-6 pt-2 border-t border-slate-100">
      {/* 🟢 TYPE 1: เข้าพบร้านค้า / Key Farmer */}
      {isType1Active && (
        <Type1ActualForm
          isVisible={true}
          targets={targets}
          target={targets[0]}
          products={products}
          targetActualResults={type1State.t1TargetItems}
          onUpdateTargetActualResults={type1State.syncFromTargetItems}
          productAdvice={type1State.t1ProductAdvice}
          setProductAdvice={type1State.setT1ProductAdvice}
          advisedProducts={type1State.t1AdvisedProducts}
          setAdvisedProducts={type1State.setT1AdvisedProducts}
          detail={type1State.t1Detail}
          setDetail={type1State.setT1Detail}
          discussionResult={type1State.t1DiscussionResult}
          setDiscussionResult={type1State.setT1DiscussionResult}
          salesOpportunity={type1State.t1SalesOpportunity}
          setSalesOpportunity={type1State.setT1SalesOpportunity}
          nextAction={type1State.t1NextAction}
          setNextAction={type1State.setT1NextAction}
          nextMeetingDate={type1State.t1NextMeetingDate}
          setNextMeetingDate={type1State.setT1NextMeetingDate}
          farmerHomeAddress={type1State.t1FarmerHomeAddress}
          setFarmerHomeAddress={type1State.setT1FarmerHomeAddress}
          plotLatitude={type1State.t1PlotLatitude}
          setPlotLatitude={type1State.setT1PlotLatitude}
          plotLongitude={type1State.t1PlotLongitude}
          setPlotLongitude={type1State.setT1PlotLongitude}
          plotImages={type1State.t1PlotImages}
          setPlotImages={type1State.setT1PlotImages}
        />
      )}

      {/* 🔵 TYPE 2: ติดตามผลการใช้สินค้า (Product Follow-up) */}
      {isType2Active && type2State && (
        <Type2ActualForm
          isVisible={true}
          targets={
            type2Targets && type2Targets.length > 0
              ? type2Targets
              : plan?.type2Targets
          }
          target={type2Targets?.[0] || plan?.type2Targets?.[0]}
          planType={plan?.planType}
          products={products}
          followupResults={type2State.t2FollowupResults}
          onUpdateFollowupResults={type2State.setT2FollowupResults}
          detail={type2State.t2Detail}
          setDetail={type2State.setT2Detail}
          followupDetail={type2State.t2FollowupDetail}
          setFollowupDetail={type2State.setT2FollowupDetail}
          usageResult={type2State.t2UsageResult}
          setUsageResult={type2State.setT2UsageResult}
          problemDetail={type2State.t2ProblemDetail}
          setProblemDetail={type2State.setT2ProblemDetail}
          images={type2State.t2Images}
          setImages={type2State.setT2Images}
        />
      )}

      {/* 🟣 TYPE 3: เสนอขายสินค้า (Product Sales Proposal) */}
      {isType3Active && type3State && (
        <Type3ActualForm
          isVisible={true}
          targets={
            type3Targets && type3Targets.length > 0
              ? type3Targets
              : plan?.type3Targets
          }
          target={type3Targets?.[0] || plan?.type3Targets?.[0]}
          planType={plan?.planType}
          products={products}
          soldProducts={type3State.soldProducts}
          setSoldProducts={type3State.setSoldProducts}
          actualSales={type3State.actualSales}
          setActualSales={type3State.setActualSales}
          actualQuantity={type3State.actualQuantity}
          setActualQuantity={type3State.setActualQuantity}
          unclosedReason={type3State.unclosedReason}
          setUnclosedReason={type3State.setUnclosedReason}
          productSalesDetails={type3State.productSalesDetails}
          setProductSalesDetails={type3State.setProductSalesDetails}
        />
      )}

      {/* 🟠 TYPE 4: วางบิล / เก็บเงิน (Billing & Payment Collection) */}
      {isType4Active && type4State && (
        <Type4ActualForm
          isVisible={true}
          targets={
            type4Targets && type4Targets.length > 0
              ? type4Targets
              : plan?.type4Targets
          }
          target={type4Targets?.[0] || plan?.type4Targets?.[0]}
          planType={plan?.planType}
          orderNo={type4State.t4OrderNo}
          setOrderNo={type4State.setT4OrderNo}
          receivedAmount={type4State.t4ReceivedAmount}
          setReceivedAmount={type4State.setT4ReceivedAmount}
          billingStatus={type4State.t4BillingStatus}
          setBillingStatus={type4State.setT4BillingStatus}
          billingDetail={type4State.t4BillingDetail}
          setBillingDetail={type4State.setT4BillingDetail}
          collectDetail={type4State.t4CollectDetail}
          setCollectDetail={type4State.setT4CollectDetail}
          paymentImages={type4State.t4PaymentImages}
          onUploadImages={type4State.handleUploadImages}
          onRemoveImage={type4State.handleRemoveImage}
        />
      )}

      {/* 🟣 TYPE 5: สำรวจตลาดของคู่แข่ง (Competitor Market Survey) */}
      {isType5Active && type5State && (
        <Type5ActualForm
          isVisible={true}
          targets={
            type5Targets && type5Targets.length > 0
              ? type5Targets
              : plan?.type5Targets
          }
          target={type5Targets?.[0] || plan?.type5Targets?.[0]}
          planType={plan?.planType}
          surveyDetails={type5State.t5SurveyDetails}
          onUpdateSurveyItem={type5State.handleUpdateT5SurveyItem}
          competitorBrand={type5State.t5CompetitorBrand}
          setCompetitorBrand={type5State.setT5CompetitorBrand}
          competitorProduct={type5State.t5CompetitorProduct}
          setCompetitorProduct={type5State.setT5CompetitorProduct}
        />
      )}

      {/* 🔴 TYPE 6: ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา (Customer Complaint / Issue Resolution) */}
      {isType6Active && type6State && (
        <Type6ActualForm
          isVisible={true}
          targets={
            type6Targets && type6Targets.length > 0
              ? type6Targets
              : plan?.type6Targets
          }
          target={type6Targets?.[0] || plan?.type6Targets?.[0]}
          planType={plan?.planType}
          products={products}
          customers={customers}
          productId={type6State.t6ProductId}
          setProductId={type6State.setT6ProductId}
          productName={type6State.t6ProductName}
          setProductName={type6State.setT6ProductName}
          lotNumber={type6State.t6LotNumber}
          setLotNumber={type6State.setT6LotNumber}
          purchaseChannel={type6State.t6PurchaseChannel}
          setPurchaseChannel={type6State.setT6PurchaseChannel as any}
          storeId={type6State.t6StoreId}
          setStoreId={type6State.setT6StoreId}
          storeName={type6State.t6StoreName}
          setStoreName={type6State.setT6StoreName}
          issueType={type6State.t6IssueType}
          setIssueType={type6State.setT6IssueType}
          detail={type6State.t6Detail}
          setDetail={type6State.setT6Detail}
          status={type6State.t6Status}
          setStatus={type6State.setT6Status}
          images={type6State.t6Images}
          setImages={type6State.setT6Images}
        />
      )}

      {/* 🟢 TYPE 7A: จัดทำแปลงสาธิต (New Demo Plot Creation) */}
      {isType7aActive && type7aState && (
        <Type7aActualForm
          isVisible={true}
          targets={
            type7aTargets && type7aTargets.length > 0
              ? type7aTargets
              : plan?.type7aPlots
          }
          target={type7aTargets?.[0] || plan?.type7aPlots?.[0]}
          planType={plan?.planType}
          products={products}
          customers={customers}
          actualState={type7aState.actualState}
          onUpdateField={type7aState.handleUpdateField}
        />
      )}

      {/* 🟢 TYPE 7B: ติดตามแปลงสาธิต (Demo Plot Follow-up) */}
      {isType7bActive && type7bState && (
        <Type7bActualForm
          isVisible={true}
          targets={
            type7bTargets && type7bTargets.length > 0
              ? type7bTargets
              : plan?.type7bPlots || plan?.type7b?.plots
          }
          target={type7bTargets?.[0] || plan?.type7bPlots?.[0] || plan?.type7b?.plots?.[0]}
          planType={plan?.planType}
          products={products}
          customers={customers}
          actualState={type7bState.actualState}
          onUpdateField={type7bState.handleUpdateField}
        />
      )}
    </div>
  );
}
