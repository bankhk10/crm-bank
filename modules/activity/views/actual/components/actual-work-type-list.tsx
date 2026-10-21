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
import {
  Type8ActualForm,
  type Type8TargetItem,
  type useType8Actual,
} from "@/modules/activity/features/type-8";
import {
  Type9ActualForm,
  type Type9TargetItem,
  type useType9Actual,
} from "@/modules/activity/features/type-9";
import {
  Type10ActualForm,
  type Type10TargetItem,
  type useType10Actual,
} from "@/modules/activity/features/type-10";
import {
  Type11ActualForm,
  type Type11TargetItem,
  type useType11Actual,
} from "@/modules/activity/features/type-11";
import {
  Type12ActualForm,
  type Type12TargetItem,
  type useType12Actual,
} from "@/modules/activity/features/type-12";
import {
  Type13ActualForm,
  type Type13TargetItem,
  type useType13Actual,
} from "@/modules/activity/features/type-13";
import {
  Type14ActualForm,
  type Type14TargetItem,
  type useType14Actual,
} from "@/modules/activity/features/type-14";

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
  type8State?: ReturnType<typeof useType8Actual>;
  type9State?: ReturnType<typeof useType9Actual>;
  type10State?: ReturnType<typeof useType10Actual>;
  type11State?: ReturnType<typeof useType11Actual>;
  type12State?: ReturnType<typeof useType12Actual>;
  type13State?: ReturnType<typeof useType13Actual>;
  type14State?: ReturnType<typeof useType14Actual>;
  targets: Type1TargetItem[];
  type2Targets?: Type2TargetItem[];
  type3Targets?: Type3TargetItem[];
  type4Targets?: Type4TargetItem[];
  type5Targets?: Type5TargetItem[];
  type6Targets?: Type6TargetItem[];
  type7aTargets?: Type7aTargetItem[];
  type7bTargets?: Type7bTargetItem[];
  type8Targets?: Type8TargetItem[];
  type9Targets?: Type9TargetItem[];
  type10Targets?: Type10TargetItem[];
  type11Targets?: Type11TargetItem[];
  type12Targets?: Type12TargetItem[];
  type13Targets?: Type13TargetItem[];
  type14Targets?: Type14TargetItem[];
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
  type8State,
  type9State,
  type10State,
  type11State,
  type12State,
  type13State,
  type14State,
  targets,
  type2Targets = [],
  type3Targets = [],
  type4Targets = [],
  type5Targets = [],
  type6Targets = [],
  type7aTargets = [],
  type7bTargets = [],
  type8Targets = [],
  type9Targets = [],
  type10Targets = [],
  type11Targets = [],
  type12Targets = [],
  type13Targets = [],
  type14Targets = [],
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
        (s: any) => s.workTypeCode === "TYPE_1" || s.workTypeCode === "VISIT",
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
    (planWorkTypes.includes("แปลงสาธิต") &&
      !planWorkTypes.includes("ติดตาม")) ||
    Boolean(plan?.type7aPlots?.length) ||
    Boolean(plan?.stores?.some((s: any) => s.workTypeCode === "TYPE_7A")) ||
    plan?.activityType?.code === "TYPE_7A";

  const isType7bActive =
    planWorkTypes.includes("TYPE_7B") ||
    planWorkTypes.includes("ติดตามแปลงสาธิต") ||
    Boolean(plan?.type7bPlots?.length) ||
    Boolean(plan?.type7bData) ||
    Boolean(plan?.type7b) ||
    Boolean(plan?.stores?.some((s: any) => s.workTypeCode === "TYPE_7B")) ||
    plan?.activityType?.code === "TYPE_7B";

  const isType8Active =
    planWorkTypes.includes("TYPE_8") ||
    planWorkTypes.includes("จัดประชุม") ||
    planWorkTypes.includes("ประชุม") ||
    Boolean(plan?.type8Targets?.length) ||
    Boolean(plan?.type8Items?.length) ||
    Boolean(plan?.type8Meetings?.length) ||
    Boolean(plan?.type8Data) ||
    Boolean(plan?.type8) ||
    Boolean(plan?.stores?.some((s: any) => s.workTypeCode === "TYPE_8")) ||
    plan?.activityType?.code === "TYPE_8";

  const isType9Active =
    planWorkTypes.includes("TYPE_9") ||
    planWorkTypes.includes("จัดกิจกรรมส่งเสริมการขายหน้าร้าน") ||
    planWorkTypes.includes("ส่งเสริมการขายหน้าร้าน") ||
    planWorkTypes.includes("กิจกรรมหน้าร้าน") ||
    Boolean(plan?.type9Targets?.length) ||
    Boolean(plan?.type9Items?.length) ||
    Boolean(plan?.type9Stores?.length) ||
    Boolean(plan?.type9Data) ||
    Boolean(plan?.type9) ||
    Boolean(
      plan?.stores?.some(
        (s: any) =>
          s.workTypeCode === "TYPE_9" ||
          s.workTypeCode === "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
      ),
    ) ||
    plan?.activityType?.code === "TYPE_9";

  const isType10Active =
    planWorkTypes.includes("TYPE_10") ||
    planWorkTypes.includes("จัดงาน Field Day") ||
    planWorkTypes.includes("Field Day") ||
    Boolean(plan?.type10Targets?.length) ||
    Boolean(plan?.type10Plots?.length) ||
    Boolean(plan?.type10Data) ||
    Boolean(plan?.type10) ||
    Boolean(
      plan?.demoPlotVisits?.some(
        (v: any) =>
          v.workTypeCode === "TYPE_10" || v.workTypeCode === "จัดงาน Field Day",
      ),
    ) ||
    plan?.activityType?.code === "TYPE_10";

  const isType11Active =
    planWorkTypes.includes("TYPE_11") ||
    planWorkTypes.includes("ตรวจเช็คสต๊อกหน้าร้าน") ||
    planWorkTypes.includes("ตรวจเช็กสต็อก") ||
    Boolean(plan?.type11Targets?.length) ||
    Boolean(plan?.type11Stores?.length) ||
    Boolean(plan?.type11Data) ||
    Boolean(plan?.type11) ||
    Boolean(
      plan?.stores?.some(
        (s: any) =>
          s.workTypeCode === "TYPE_11" ||
          s.workTypeCode === "ตรวจเช็คสต๊อกหน้าร้าน",
      ),
    ) ||
    plan?.activityType?.code === "TYPE_11";

  const isType12Active =
    planWorkTypes.includes("TYPE_12") ||
    planWorkTypes.includes("ทัวร์") ||
    planWorkTypes.includes("ทัวร์") ||
    planWorkTypes.includes("ศึกษาดูงาน") ||
    Boolean(plan?.tour) ||
    Boolean(plan?.tourData) ||
    plan?.activityType?.code === "TYPE_12";

  const isType13Active =
    planWorkTypes.includes("TYPE_13") ||
    planWorkTypes.includes("ฉีดแปลงแฮตแทค") ||
    planWorkTypes.includes("ฉีดแปลงแฮตแทค") ||
    planWorkTypes.includes("ฉีดแปลง") ||
    Boolean(plan?.type13Plots?.length) ||
    Boolean(plan?.type13Targets?.length) ||
    Boolean(plan?.t13Plots?.length) ||
    Boolean(plan?.type13Data) ||
    Boolean(plan?.type13) ||
    plan?.activityType?.code === "TYPE_13";

  const isType14Active =
    planWorkTypes.includes("TYPE_14") ||
    planWorkTypes.includes("ติดตามแปลงแฮตแทค") ||
    planWorkTypes.includes("ติดตามแปลงแฮตแทค") ||
    planWorkTypes.includes("ติดตามแปลง") ||
    Boolean(plan?.type14Plots?.length) ||
    Boolean(plan?.type14Targets?.length) ||
    Boolean(plan?.t14Plots?.length) ||
    Boolean(plan?.type14Data) ||
    Boolean(plan?.type14) ||
    plan?.activityType?.code === "TYPE_14";

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
          target={
            type7bTargets?.[0] ||
            plan?.type7bPlots?.[0] ||
            plan?.type7b?.plots?.[0]
          }
          planType={plan?.planType}
          products={products}
          customers={customers}
          actualState={type7bState.actualState}
          onUpdateField={type7bState.handleUpdateField}
        />
      )}

      {/* 🟢 TYPE 8: จัดประชุม (Meeting) */}
      {isType8Active && type8State && (
        <Type8ActualForm
          isVisible={true}
          targets={
            type8Targets && type8Targets.length > 0
              ? type8Targets
              : plan?.type8Targets || plan?.type8Items || plan?.type8Meetings
          }
          target={
            type8Targets?.[0] ||
            plan?.type8Targets?.[0] ||
            plan?.type8Items?.[0] ||
            plan?.type8Meetings?.[0]
          }
          planType={plan?.planType}
          products={products}
          actualAttendees={type8State.actualAttendees}
          setActualAttendees={type8State.setActualAttendees}
          feedbackQnA={type8State.feedbackQnA}
          setFeedbackQnA={type8State.setFeedbackQnA}
          productSalesDetails={type8State.productSalesDetails}
          setProductSalesDetails={type8State.setProductSalesDetails}
          images={type8State.images}
          setImages={type8State.setImages}
          registrationImages={type8State.registrationImages}
          setRegistrationImages={type8State.setRegistrationImages}
        />
      )}

      {/* 🟢 TYPE 9: จัดกิจกรรมส่งเสริมการขายหน้าร้าน (Store Event) */}
      {isType9Active && type9State && (
        <Type9ActualForm
          isVisible={true}
          targets={
            type9Targets && type9Targets.length > 0
              ? type9Targets
              : plan?.type9Targets || plan?.type9Stores || plan?.type9Items
          }
          target={
            type9Targets?.[0] ||
            plan?.type9Targets?.[0] ||
            plan?.type9Stores?.[0] ||
            plan?.type9Items?.[0]
          }
          planType={plan?.planType}
          products={products}
          actualSales={type9State.actualSales}
          setActualSales={type9State.setActualSales}
          productSalesDetails={type9State.productSalesDetails}
          setProductSalesDetails={type9State.setProductSalesDetails}
          actualAttendees={type9State.actualAttendees}
          setActualAttendees={type9State.setActualAttendees}
          images={type9State.images}
          setImages={type9State.setImages}
        />
      )}

      {/* 🟢 TYPE 10: จัดงาน Field Day */}
      {isType10Active && type10State && (
        <Type10ActualForm
          isVisible={true}
          targets={
            type10Targets && type10Targets.length > 0
              ? type10Targets
              : plan?.type10Targets || plan?.type10Plots
          }
          target={
            type10Targets?.[0] ||
            plan?.type10Targets?.[0] ||
            plan?.type10Plots?.[0]
          }
          planType={plan?.planType}
          products={products}
          actualAttendees={type10State.actualAttendees}
          setActualAttendees={type10State.setActualAttendees}
          actualSalesOrBooking={type10State.actualSalesOrBooking}
          setActualSalesOrBooking={type10State.setActualSalesOrBooking}
          farmerFeedback={type10State.farmerFeedback}
          setFarmerFeedback={type10State.setFarmerFeedback}
          soldProducts={type10State.soldProducts}
          setSoldProducts={type10State.setSoldProducts}
          images={type10State.images}
          setImages={type10State.setImages}
        />
      )}

      {/* 🟢 TYPE 11: ตรวจเช็คสต๊อกหน้าร้าน */}
      {isType11Active && type11State && (
        <Type11ActualForm
          isVisible={true}
          targets={
            type11Targets && type11Targets.length > 0
              ? type11Targets
              : plan?.type11Targets || plan?.type11Stores
          }
          target={
            type11Targets?.[0] ||
            plan?.type11Targets?.[0] ||
            plan?.type11Stores?.[0]
          }
          planType={plan?.planType}
          products={products}
          stockItems={type11State.stockItems}
          setStockItems={type11State.setStockItems}
          productList={type11State.productList}
          setProductList={type11State.setProductList}
          remainingQty={type11State.remainingQty}
          setRemainingQty={type11State.setRemainingQty}
          remarks={type11State.remarks}
          setRemarks={type11State.setRemarks}
          nextAction={type11State.nextAction}
          setNextAction={type11State.setNextAction}
          images={type11State.images}
          setImages={type11State.setImages}
        />
      )}

      {/* 🟢 TYPE 12: ทัวร์ */}
      {isType12Active && type12State && (
        <Type12ActualForm
          isVisible={true}
          targets={
            type12Targets?.length
              ? type12Targets
              : plan?.tour
                ? [plan.tour]
                : undefined
          }
          target={type12Targets?.[0] || plan?.tour || plan?.tourData}
          planType={plan?.planType}
          actualAttendees={type12State.actualAttendees}
          setActualAttendees={type12State.setActualAttendees}
          tourHighlights={type12State.tourHighlights}
          setTourHighlights={type12State.setTourHighlights}
          feedbackIssues={type12State.feedbackIssues}
          setFeedbackIssues={type12State.setFeedbackIssues}
          images={type12State.images}
          setImages={type12State.setImages}
          onUploadImages={type12State.uploadImages}
        />
      )}

      {/* 🟢 TYPE 13: ฉีดแปลงแฮตแทค */}
      {isType13Active && type13State && (
        <Type13ActualForm
          isVisible={true}
          actualState={type13State}
          products={products || []}
          dealers={customers || []}
          targets={type13Targets || plan?.type13Plots || plan?.t13Plots}
        />
      )}

      {/* 🟢 TYPE 14: ติดตามแปลงแฮตแทค */}
      {isType14Active && type14State && (
        <Type14ActualForm
          isVisible={true}
          actualState={type14State}
          products={products || []}
          dealers={customers || []}
          targets={type14Targets || plan?.type14Plots || plan?.t14Plots}
        />
      )}
    </div>
  );
}
