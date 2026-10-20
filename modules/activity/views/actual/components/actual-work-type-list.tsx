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

interface ActualWorkTypeListProps {
  planWorkTypes: string[];
  type1State: ReturnType<typeof useType1Actual>;
  type2State?: ReturnType<typeof useType2Actual>;
  type3State?: ReturnType<typeof useType3Actual>;
  targets: Type1TargetItem[];
  type2Targets?: Type2TargetItem[];
  type3Targets?: Type3TargetItem[];
  plan?: any;
  products?: any[];
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
  targets,
  type2Targets = [],
  type3Targets = [],
  plan,
  products = [],
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
    </div>
  );
}
