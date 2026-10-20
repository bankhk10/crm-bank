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

interface ActualWorkTypeListProps {
  planWorkTypes: string[];
  type1State: ReturnType<typeof useType1Actual>;
  type2State?: ReturnType<typeof useType2Actual>;
  type3State?: ReturnType<typeof useType3Actual>;
  type4State?: ReturnType<typeof useType4Actual>;
  targets: Type1TargetItem[];
  type2Targets?: Type2TargetItem[];
  type3Targets?: Type3TargetItem[];
  type4Targets?: Type4TargetItem[];
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
  type4State,
  targets,
  type2Targets = [],
  type3Targets = [],
  type4Targets = [],
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

  const isType4Active =
    planWorkTypes.includes("TYPE_4") ||
    planWorkTypes.includes("วางบิล / เก็บเงิน") ||
    planWorkTypes.includes("วางบิล") ||
    planWorkTypes.includes("เก็บเงิน") ||
    Boolean(plan?.type4Targets?.length);

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
    </div>
  );
}
