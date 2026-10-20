"use client";

import React, { useMemo } from "react";
import { Target, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Type1ApprovalCard,
  Type1DetailView,
  type Type1TargetItem,
  type Type1ImageFile,
} from "@/modules/activity/features/type-1";
import {
  Type2ApprovalCard,
  Type2DetailView,
} from "@/modules/activity/features/type-2";
import {
  Type3ApprovalCard,
  Type3DetailView,
} from "@/modules/activity/features/type-3";
import {
  Type4ApprovalCard,
  Type4DetailView,
} from "@/modules/activity/features/type-4";
import {
  Type5ApprovalCard,
  Type5DetailView,
} from "@/modules/activity/features/type-5";
import {
  Type6ApprovalCard,
  Type6DetailView,
} from "@/modules/activity/features/type-6";
import {
  Type7aApprovalCard,
  Type7aDetailView,
} from "@/modules/activity/features/type-7a";
import {
  Type7bApprovalCard,
  Type7bDetailView,
} from "@/modules/activity/features/type-7b";
import {
  Type8ApprovalCard,
  Type8DetailView,
} from "@/modules/activity/features/type-8";
import {
  Type9ApprovalCard,
  Type9DetailView,
} from "@/modules/activity/features/type-9";

interface ApprovalWorkTypeListProps {
  plan?: any;
  targets?: any;
  type1Targets: {
    primary: Type1TargetItem;
    list: Type1TargetItem[];
  };
  parsedResults?: any;
  isTypeActive: (code: string, label: string) => boolean;
}

/**
 * Component กลางสำหรับแสดงรายละเอียดของประเภทงานในหน้าพิจารณาอนุมัติ (Approvals)
 * รองรับทั้งแผนงานปกติ (Trip Plan) และกิจกรรมนอกแผน (Unplanned Activity 2-in-1 ที่มีผลงานจริง)
 * สอดคล้องกับ DetailWorkTypeList และ ActualWorkTypeList โดยยึด Type 1 เป็น Gold Standard
 */
export function ApprovalWorkTypeList({
  plan,
  targets,
  type1Targets,
  parsedResults,
  isTypeActive,
}: ApprovalWorkTypeListProps) {
  const isType1 =
    isTypeActive("TYPE_1", "เข้าพบเกษตรกร") ||
    isTypeActive("TYPE_1", "เข้าพบร้านค้า / Key Farmer");

  const isType2 =
    isTypeActive("TYPE_2", "ติดตามผลการใช้สินค้า") ||
    isTypeActive("TYPE_2", "ติดตามผล") ||
    Boolean(plan?.type2Targets?.length);

  const isType3 =
    isTypeActive("TYPE_3", "เสนอขายสินค้า") ||
    isTypeActive("TYPE_3", "เสนอขาย") ||
    Boolean(plan?.type3Targets?.length);

  const isType4 =
    isTypeActive("TYPE_4", "วางบิล / เก็บเงิน") ||
    isTypeActive("TYPE_4", "วางบิล") ||
    isTypeActive("TYPE_4", "เก็บเงิน") ||
    Boolean(plan?.type4Targets?.length);

  const isType5 =
    isTypeActive("TYPE_5", "สำรวจตลาดของคู่แข่ง") ||
    isTypeActive("TYPE_5", "สำรวจตลาด") ||
    Boolean(plan?.type5Targets?.length);

  const isType6 =
    isTypeActive("TYPE_6", "ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา") ||
    isTypeActive("TYPE_6", "ร้องเรียน") ||
    isTypeActive("TYPE_6", "แก้ปัญหา") ||
    Boolean(plan?.type6Targets?.length);

  const isType7a =
    (isTypeActive("TYPE_7A", "จัดทำแปลงสาธิต") ||
      isTypeActive("TYPE_7A", "แปลงสาธิต") ||
      Boolean(plan?.type7aPlots?.length) ||
      Boolean(plan?.demoPlots?.length)) &&
    !isTypeActive("TYPE_7B", "ติดตามแปลงสาธิต");

  const isType7b =
    isTypeActive("TYPE_7B", "ติดตามแปลงสาธิต") ||
    Boolean(plan?.type7bFollowUps?.length) ||
    Boolean(plan?.type7bPlots?.length) ||
    Boolean(plan?.type7b?.plots?.length);

  const isType8 =
    isTypeActive("TYPE_8", "จัดประชุม") ||
    isTypeActive("TYPE_8", "ประชุม") ||
    Boolean(plan?.type8Targets?.length) ||
    Boolean(plan?.type8Items?.length) ||
    Boolean(plan?.type8Meetings?.length) ||
    Boolean(plan?.type8Data) ||
    Boolean(plan?.type8);

  const isType9 =
    isTypeActive("TYPE_9", "จัดกิจกรรมส่งเสริมการขายหน้าร้าน") ||
    isTypeActive("TYPE_9", "กิจกรรมหน้าร้าน") ||
    Boolean(plan?.type9Targets?.length) ||
    Boolean(plan?.type9Items?.length) ||
    Boolean(plan?.type9Stores?.length) ||
    Boolean(plan?.type9Data) ||
    Boolean(plan?.type9);

  const isUnplanned = plan?.planType === "UNPLANNED";

  // ตรวจสอบว่ามีข้อมูลผลการปฏิบัติงานจริง (Actual Result) หรือไม่
  const hasActualResults = useMemo(() => {
    if (isUnplanned) return true;
    if (plan?.result || plan?.type1Result || (plan?.type1Results && plan.type1Results.length > 0)) {
      return true;
    }
    const primary = type1Targets.primary;
    if (
      primary?.discussionResult ||
      primary?.farmerHomeAddress ||
      primary?.plotLatitude ||
      primary?.productAdvice
    ) {
      return true;
    }
    return Boolean(
      type1Targets.list &&
        type1Targets.list.some(
          (t) => t.discussionResult || t.plotLatitude || t.farmerHomeAddress || t.productAdvice,
        ),
    );
  }, [isUnplanned, plan, type1Targets]);

  const hasType2ActualResults = useMemo(() => {
    if (isUnplanned) return true;
    if (
      plan?.result?.followupResults &&
      plan.result.followupResults.length > 0
    ) {
      return true;
    }
    if (
      parsedResults?.t2FollowupResults &&
      parsedResults.t2FollowupResults.length > 0
    ) {
      return true;
    }
    return Boolean(
      parsedResults?.t2UsageResult ||
        parsedResults?.t2ProblemDetail ||
        parsedResults?.t2FollowupDetail,
    );
  }, [isUnplanned, plan, parsedResults]);

  const hasType3ActualResults = useMemo(() => {
    if (isUnplanned) return true;
    if (
      plan?.result?.saleResults &&
      plan.result.saleResults.length > 0
    ) {
      return true;
    }
    if (
      parsedResults?.t3ProductSalesDetails &&
      parsedResults.t3ProductSalesDetails.length > 0
    ) {
      return true;
    }
    return Boolean(
      parsedResults?.t3ActualQuantity ||
        parsedResults?.t3ActualSales ||
        parsedResults?.t3SoldProducts,
    );
  }, [isUnplanned, plan, parsedResults]);

  const hasType4ActualResults = useMemo(() => {
    if (isUnplanned) return true;
    if (plan?.result?.activityResultType4 || plan?.result?.type4Result) {
      return true;
    }
    return Boolean(
      parsedResults?.t4OrderNo ||
        parsedResults?.t4ReceivedAmount ||
        parsedResults?.t4BillingStatus ||
        parsedResults?.t4BillingDetail ||
        parsedResults?.t4CollectDetail,
    );
  }, [isUnplanned, plan, parsedResults]);

  const hasType5ActualResults = useMemo(() => {
    if (isUnplanned) return true;
    if (plan?.result?.surveyResults?.length) return true;
    return Boolean(
      (parsedResults?.t5SurveyDetails &&
        parsedResults.t5SurveyDetails.length > 0) ||
        parsedResults?.t5CompetitorBrand ||
        parsedResults?.t5CompetitorProduct,
    );
  }, [isUnplanned, plan, parsedResults]);

  const hasType6ActualResults = useMemo(() => {
    if (isUnplanned) return true;
    if (plan?.result?.issueResults?.length) return true;
    return Boolean(
      parsedResults?.t6IssueRecord ||
        parsedResults?.t6ProblemDetail ||
        parsedResults?.t6InitialSolution ||
        (parsedResults?.t6Images && parsedResults.t6Images.length > 0),
    );
  }, [isUnplanned, plan, parsedResults]);

  const hasType7aActualResults = useMemo(() => {
    if (isUnplanned) return true;
    if (plan?.result?.type7aPlots?.length) return true;
    return Boolean(
      parsedResults?.t7PlotName ||
        parsedResults?.t7CropName ||
        (parsedResults?.t7InitialPhotos && parsedResults.t7InitialPhotos.length > 0) ||
        (plan?.attachments &&
          plan.attachments.some(
            (a: any) =>
              a.workTypeCode === "TYPE_7A" ||
              a.category === "PLOT" ||
              a.category === "INITIAL",
          )),
    );
  }, [isUnplanned, plan, parsedResults]);

  const hasType7bActualResults = useMemo(() => {
    if (isUnplanned) return true;
    if (plan?.result?.type7bActual) return true;
    return Boolean(
      parsedResults?.type7bActual ||
        parsedResults?.t7CropCondition ||
        (parsedResults?.t7CropImages && parsedResults.t7CropImages.length > 0) ||
        (plan?.attachments &&
          plan.attachments.some(
            (a: any) =>
              a.workTypeCode === "TYPE_7B" ||
              a.category === "CROP",
          )),
    );
  }, [isUnplanned, plan, parsedResults]);

  const hasType8ActualResults = useMemo(() => {
    if (isUnplanned) return true;
    if (plan?.result?.type8Actual) return true;
    return Boolean(
      parsedResults?.type8Actual ||
        parsedResults?.t8ActualAttendees ||
        parsedResults?.t8FeedbackQnA ||
        (parsedResults?.t8RegistrationImages && parsedResults.t8RegistrationImages.length > 0) ||
        (plan?.attachments &&
          plan.attachments.some(
            (a: any) =>
              a.workTypeCode === "TYPE_8" &&
              (a.category === "REGISTRATION" || a.category === "ATMOSPHERE" || a.group === "REGISTRATION"),
          )),
    );
  }, [isUnplanned, plan, parsedResults]);

  const hasType9ActualResults = useMemo(() => {
    if (isUnplanned) return true;
    if (plan?.result?.type9Actual || plan?.type9Actual) return true;
    return Boolean(
      parsedResults?.type9Actual ||
        parsedResults?.actualSales ||
        parsedResults?.actualAttendees ||
        (parsedResults?.type9Actual?.images && parsedResults.type9Actual.images.length > 0) ||
        (parsedResults?.t9Images && parsedResults.t9Images.length > 0) ||
        (plan?.attachments &&
          plan.attachments.some(
            (a: any) =>
              a.workTypeCode === "TYPE_9" ||
              a.category === "ATMOSPHERE" ||
              a.category === "STORE_EVENT" ||
              a.category === "type9",
          )),
    );
  }, [isUnplanned, plan, parsedResults]);

  // รวบรวมรูปภาพ (Attachments / Plot Images) สำหรับแสดงผลในการ์ดอนุมัติ
  const effectiveImages = useMemo<Type1ImageFile[]>(() => {
    if (parsedResults?.t1PlotImages && parsedResults.t1PlotImages.length > 0) {
      return parsedResults.t1PlotImages;
    }
    const rawAttachments: any[] = plan?.attachments || [];
    return rawAttachments
      .filter((att) => ["PLOT", "STORE", "GENERAL"].includes(att.category))
      .map((att) => ({
        id: att.id,
        url: att.fileUrl,
        name: att.fileName || "รูปภาพ",
      }));
  }, [parsedResults?.t1PlotImages, plan?.attachments]);

  // รวมรายการแนะนำสินค้า (Product Advice) หากมีบันทึกใน type1Products
  const effectiveProductAdvice = useMemo(() => {
    if (type1Targets.primary?.productAdvice) {
      return type1Targets.primary.productAdvice;
    }
    if (plan?.type1Products && Array.isArray(plan.type1Products) && plan.type1Products.length > 0) {
      return plan.type1Products
        .map((p: any) => p.product?.name || p.productName || "")
        .filter(Boolean)
        .join(", ");
    }
    return undefined;
  }, [type1Targets.primary?.productAdvice, plan?.type1Products]);

  // รวบรวมรูปภาพ Type 4 (Payment Images)
  const effectiveT4Images = useMemo(() => {
    if (parsedResults?.t4PaymentImages && parsedResults.t4PaymentImages.length > 0) {
      return parsedResults.t4PaymentImages;
    }
    const rawAttachmentsList: any[] = [
      ...(plan?.attachments || []),
      ...(plan?.result?.attachments || []),
    ];
    return rawAttachmentsList
      .filter(
        (att) =>
          att?.workTypeCode === "TYPE_4" ||
          att?.category === "PAYMENT",
      )
      .map((att) => ({
        id: att.id,
        url: att.fileUrl || att.url,
        name: att.fileName || att.name || "หลักฐานการชำระเงิน",
      }));
  }, [parsedResults?.t4PaymentImages, plan?.attachments, plan?.result?.attachments]);

  // รวบรวมรูปภาพ Type 6 (Issue Images)
  const effectiveT6Images = useMemo(() => {
    if (parsedResults?.t6Images && parsedResults.t6Images.length > 0) {
      return parsedResults.t6Images;
    }
    const rawAttachmentsList: any[] = [
      ...(plan?.attachments || []),
      ...(plan?.result?.attachments || []),
    ];
    return rawAttachmentsList
      .filter(
        (att) =>
          att?.workTypeCode === "TYPE_6" ||
          att?.category === "ISSUE",
      )
      .map((att) => ({
        id: att.id,
        url: att.fileUrl || att.url,
        name: att.fileName || att.name || "รูปภาพปัญหา",
      }));
  }, [parsedResults?.t6Images, plan?.attachments, plan?.result?.attachments]);

  // รวบรวมรูปภาพ Type 7A (Attachments / Plot Photos)
  const effectiveT7aImages = useMemo(() => {
    if (parsedResults?.t7InitialPhotos && parsedResults.t7InitialPhotos.length > 0) {
      return parsedResults.t7InitialPhotos;
    }
    const rawAttachmentsList: any[] = [
      ...(plan?.attachments || []),
      ...(plan?.result?.attachments || []),
    ];
    return rawAttachmentsList
      .filter(
        (att) =>
          att?.workTypeCode === "TYPE_7A" ||
          att?.category === "PLOT" ||
          att?.category === "INITIAL",
      )
      .map((att) => ({
        id: att.id,
        url: att.fileUrl || att.url,
        name: att.fileName || att.name || "รูปถ่ายแปลงสาธิต",
      }));
  }, [parsedResults?.t7InitialPhotos, plan?.attachments, plan?.result?.attachments]);

  // รวบรวมรูปภาพ Type 7B (Attachments / Follow-up Photos)
  const effectiveT7bImages = useMemo(() => {
    if (parsedResults?.t7CropImages && parsedResults.t7CropImages.length > 0) {
      return [
        ...parsedResults.t7CropImages,
        ...(parsedResults.t7PlotImages || []),
      ];
    }
    const rawAttachmentsList: any[] = [
      ...(plan?.attachments || []),
      ...(plan?.result?.attachments || []),
    ];
    return rawAttachmentsList
      .filter(
        (att) =>
          att?.workTypeCode === "TYPE_7B" ||
          att?.category === "CROP" ||
          (att?.category === "PLOT" && isType7b && !isType7a),
      )
      .map((att) => ({
        id: att.id,
        url: att.fileUrl || att.url,
        name: att.fileName || att.name || "รูปถ่ายติดตามแปลงสาธิต",
      }));
  }, [parsedResults?.t7CropImages, parsedResults?.t7PlotImages, plan?.attachments, plan?.result?.attachments, isType7b, isType7a]);

  // รวบรวมรูปภาพ Type 8 (Attachments / Registration & Atmosphere)
  const effectiveT8RegistrationImages = useMemo(() => {
    if (
      parsedResults?.type8Actual?.t8RegistrationImages &&
      parsedResults.type8Actual.t8RegistrationImages.length > 0
    ) {
      return parsedResults.type8Actual.t8RegistrationImages;
    }
    if (
      parsedResults?.t8RegistrationImages &&
      parsedResults.t8RegistrationImages.length > 0
    ) {
      return parsedResults.t8RegistrationImages;
    }
    const rawAttachmentsList: any[] = [
      ...(plan?.attachments || []),
      ...(plan?.result?.attachments || []),
    ];
    return rawAttachmentsList
      .filter(
        (att) =>
          att?.workTypeCode === "TYPE_8" &&
          (att?.category === "REGISTRATION" || att?.group === "REGISTRATION"),
      )
      .map((att) => ({
        id: att.id,
        url: att.fileUrl || att.url,
        name: att.fileName || att.name || "รูปใบลงทะเบียน",
      }));
  }, [parsedResults?.type8Actual?.t8RegistrationImages, parsedResults?.t8RegistrationImages, plan?.attachments, plan?.result?.attachments]);

  const effectiveT8AtmosphereImages = useMemo(() => {
    if (
      parsedResults?.type8Actual?.t8Images &&
      parsedResults.type8Actual.t8Images.length > 0
    ) {
      return parsedResults.type8Actual.t8Images;
    }
    if (
      parsedResults?.t8Images &&
      parsedResults.t8Images.length > 0
    ) {
      return parsedResults.t8Images;
    }
    const rawAttachmentsList: any[] = [
      ...(plan?.attachments || []),
      ...(plan?.result?.attachments || []),
    ];
    return rawAttachmentsList
      .filter(
        (att) =>
          att?.workTypeCode === "TYPE_8" &&
          (att?.category === "ATMOSPHERE" || att?.group === "ATMOSPHERE" || att?.category === "MEETING"),
      )
      .map((att) => ({
        id: att.id,
        url: att.fileUrl || att.url,
        name: att.fileName || att.name || "ภาพบรรยากาศการประชุม",
      }));
  }, [parsedResults?.type8Actual?.t8Images, parsedResults?.t8Images, plan?.attachments, plan?.result?.attachments]);

  // รวบรวมรูปภาพ Type 9 (Attachments / Atmosphere)
  const effectiveT9Images = useMemo(() => {
    if (
      parsedResults?.type9Actual?.images &&
      parsedResults.type9Actual.images.length > 0
    ) {
      return parsedResults.type9Actual.images;
    }
    if (parsedResults?.t9Images && parsedResults.t9Images.length > 0) {
      return parsedResults.t9Images;
    }
    const rawAttachmentsList: any[] = [
      ...(plan?.attachments || []),
      ...(plan?.result?.attachments || []),
    ];
    return rawAttachmentsList
      .filter(
        (att) =>
          att?.workTypeCode === "TYPE_9" ||
          att?.category === "ATMOSPHERE" ||
          att?.category === "STORE_EVENT" ||
          att?.category === "type9",
      )
      .map((att) => ({
        id: att.id,
        url: att.fileUrl || att.url,
        name: att.fileName || att.name || "ภาพถ่ายกิจกรรมหน้าร้าน",
      }));
  }, [parsedResults?.type9Actual?.images, parsedResults?.t9Images, plan?.attachments, plan?.result?.attachments]);

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Target className="w-4 h-4" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-800">
            รายละเอียดตามประเภทงาน (Work Type Details)
          </h3>
        </div>
        {isUnplanned && (
          <Badge
            variant="outline"
            className="text-[11px] font-semibold bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-purple-600" />
            กิจกรรมนอกแผน (แสดงผลงานจริง)
          </Badge>
        )}
      </div>

      {/* 🟢 TYPE 1: เข้าพบเกษตรกร / ร้านค้า (Gold Standard Vertical Slice) */}
      {hasActualResults ? (
        <Type1DetailView
          isVisible={isType1}
          target={type1Targets.primary}
          targets={type1Targets.list}
          productAdvice={effectiveProductAdvice}
          discussionResult={type1Targets.primary?.discussionResult}
          salesOpportunity={
            (type1Targets.primary?.salesOpportunity as "สูง" | "ต่ำ" | "") || undefined
          }
          nextAction={type1Targets.primary?.nextAction}
          nextMeetingDate={type1Targets.primary?.nextMeetingDate}
          farmerHomeAddress={type1Targets.primary?.farmerHomeAddress}
          plotLatitude={type1Targets.primary?.plotLatitude}
          plotLongitude={type1Targets.primary?.plotLongitude}
          plotImages={effectiveImages}
        />
      ) : (
        <Type1ApprovalCard
          isVisible={isType1}
          target={type1Targets.primary}
          targets={type1Targets.list}
        />
      )}

      {/* 🔵 TYPE 2: ติดตามผลการใช้สินค้า (Product Follow-up) */}
      {isType2 &&
        (hasType2ActualResults ? (
          <Type2DetailView
            isVisible={true}
            target={targets?.t2}
            targets={targets?.t2List}
            followupResults={parsedResults?.t2FollowupResults}
            customerName={parsedResults?.t2CustomerName}
            detail={parsedResults?.t2Detail}
            followupDetail={parsedResults?.t2FollowupDetail}
            usageResult={parsedResults?.t2UsageResult}
            problemDetail={parsedResults?.t2ProblemDetail}
            images={parsedResults?.t2Images}
          />
        ) : (
          <Type2ApprovalCard
            isVisible={true}
            target={targets?.t2}
            targets={targets?.t2List}
          />
        ))}

      {/* 🟣 TYPE 3: เสนอขายสินค้า (Product Sales Proposal) */}
      {isType3 &&
        (hasType3ActualResults ? (
          <Type3DetailView
            isVisible={true}
            target={targets?.t3}
            targets={targets?.t3List}
            soldProducts={parsedResults?.t3SoldProducts}
            actualSales={parsedResults?.t3ActualSales}
            actualQuantity={
              parsedResults?.t3ActualQuantity != null
                ? String(parsedResults.t3ActualQuantity)
                : undefined
            }
            unclosedReason={parsedResults?.t3UnclosedReason}
            productSalesDetails={parsedResults?.t3ProductSalesDetails}
          />
        ) : (
          <Type3ApprovalCard
            isVisible={true}
            target={targets?.t3}
            targets={targets?.t3List}
          />
        ))}

      {/* 🟠 TYPE 4: วางบิล / เก็บเงิน (Billing & Payment Collection) */}
      {isType4 &&
        (hasType4ActualResults ? (
          <Type4DetailView
            isVisible={true}
            target={targets?.t4}
            targets={targets?.t4List}
            orderNo={parsedResults?.t4OrderNo}
            receivedAmount={parsedResults?.t4ReceivedAmount}
            billingStatus={parsedResults?.t4BillingStatus}
            billingDetail={parsedResults?.t4BillingDetail}
            collectDetail={parsedResults?.t4CollectDetail}
            paymentImages={effectiveT4Images}
          />
        ) : (
          <Type4ApprovalCard
            isVisible={true}
            target={targets?.t4}
            targets={targets?.t4List}
          />
        ))}

      {/* 🟣 TYPE 5: สำรวจตลาดของคู่แข่ง (Competitor Market Survey) */}
      {isType5 &&
        (hasType5ActualResults ? (
          <Type5DetailView
            isVisible={true}
            target={targets?.t5}
            targets={targets?.t5List}
            surveyDetails={parsedResults?.t5SurveyDetails}
            competitorBrand={parsedResults?.t5CompetitorBrand}
            competitorProduct={parsedResults?.t5CompetitorProduct}
          />
        ) : (
          <Type5ApprovalCard
            isVisible={true}
            target={targets?.t5}
            targets={targets?.t5List}
          />
        ))}

      {/* 🔴 TYPE 6: ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา (Customer Complaint / Issue Resolution) */}
      {isType6 &&
        (hasType6ActualResults ? (
          <Type6DetailView
            isVisible={true}
            target={targets?.t6}
            targets={targets?.t6List}
            issueRecord={parsedResults?.t6IssueRecord}
            productName={parsedResults?.t6ProductName}
            lotNumber={parsedResults?.t6LotNumber}
            purchaseChannel={parsedResults?.t6PurchaseChannel}
            storeName={parsedResults?.t6StoreName}
            issueType={parsedResults?.t6IssueType}
            detail={parsedResults?.t6Detail}
            status={parsedResults?.t6Status}
            images={effectiveT6Images}
            problemDetail={parsedResults?.t6ProblemDetail}
            initialSolution={parsedResults?.t6InitialSolution}
          />
        ) : (
          <Type6ApprovalCard
            isVisible={true}
            target={targets?.t6}
            targets={targets?.t6List}
          />
        ))}

      {/* 🟢 TYPE 7A: จัดทำแปลงสาธิต (New Demo Plot Creation) */}
      {isType7a &&
        (hasType7aActualResults ? (
          <Type7aDetailView
            isVisible={true}
            target={targets?.t7a || targets?.t7}
            targets={targets?.t7aList || targets?.t7List}
            actualResult={parsedResults}
            attachments={effectiveT7aImages}
          />
        ) : (
          <Type7aApprovalCard
            isVisible={true}
            target={targets?.t7a || targets?.t7}
            targets={targets?.t7aList || targets?.t7List}
            plan={plan}
          />
        ))}

      {/* 🟢 TYPE 7B: ติดตามแปลงสาธิต (Demo Plot Follow-up) */}
      {isType7b &&
        (hasType7bActualResults ? (
          <Type7bDetailView
            isVisible={true}
            target={targets?.t7b || targets?.t7bList?.[0]}
            targets={targets?.t7bList}
            actualResult={parsedResults?.type7bActual || parsedResults}
            attachments={effectiveT7bImages}
          />
        ) : (
          <Type7bApprovalCard
            isVisible={true}
            target={targets?.t7b || targets?.t7bList?.[0]}
            targets={targets?.t7bList}
            plan={plan}
          />
        ))}

      {/* 🟢 TYPE 8: จัดประชุม (Meeting) */}
      {isType8 &&
        (hasType8ActualResults ? (
          <Type8DetailView
            isVisible={true}
            target={targets?.t8 || targets?.t8List?.[0] || plan?.type8Targets?.[0] || plan?.type8Meetings?.[0]}
            targets={targets?.t8List || plan?.type8Targets || plan?.type8Meetings}
            actualAttendees={
              parsedResults?.type8Actual?.t8ActualAttendees != null
                ? String(parsedResults.type8Actual.t8ActualAttendees)
                : parsedResults?.t8ActualAttendees != null
                  ? String(parsedResults.t8ActualAttendees)
                  : undefined
            }
            feedbackQnA={parsedResults?.type8Actual?.t8FeedbackQnA || parsedResults?.t8FeedbackQnA}
            productSalesDetails={
              parsedResults?.type8Actual?.t8ProductSalesDetails ||
              parsedResults?.t8ProductSalesDetails ||
              plan?.productSalesDetails
            }
            registrationImages={effectiveT8RegistrationImages}
            images={effectiveT8AtmosphereImages}
          />
        ) : (
          <Type8ApprovalCard
            isVisible={true}
            target={targets?.t8 || targets?.t8List?.[0] || plan?.type8Targets?.[0] || plan?.type8Meetings?.[0]}
            targets={targets?.t8List || plan?.type8Targets || plan?.type8Meetings}
            plan={plan}
          />
        ))}

      {/* 🟢 TYPE 9: จัดกิจกรรมส่งเสริมการขายหน้าร้าน (Store Event) */}
      {isType9 &&
        (hasType9ActualResults ? (
          <Type9DetailView
            isVisible={true}
            target={
              targets?.t9 ||
              targets?.t9List?.[0] ||
              plan?.type9Targets?.[0] ||
              plan?.type9Stores?.[0] ||
              plan?.type9Items?.[0]
            }
            targets={
              targets?.t9List ||
              plan?.type9Targets ||
              plan?.type9Stores ||
              plan?.type9Items
            }
            actualSales={
              parsedResults?.type9Actual?.actualSales != null
                ? String(parsedResults.type9Actual.actualSales)
                : parsedResults?.actualSales != null
                  ? String(parsedResults.actualSales)
                  : undefined
            }
            actualAttendees={
              parsedResults?.type9Actual?.actualAttendees != null
                ? String(parsedResults.type9Actual.actualAttendees)
                : parsedResults?.actualAttendees != null
                  ? String(parsedResults.actualAttendees)
                  : undefined
            }
            productSalesDetails={
              parsedResults?.type9Actual?.productSalesDetails ||
              parsedResults?.productSalesDetails ||
              plan?.productSalesDetails
            }
            images={effectiveT9Images}
          />
        ) : (
          <Type9ApprovalCard
            isVisible={true}
            target={
              targets?.t9 ||
              targets?.t9List?.[0] ||
              plan?.type9Targets?.[0] ||
              plan?.type9Stores?.[0] ||
              plan?.type9Items?.[0]
            }
            targets={
              targets?.t9List ||
              plan?.type9Targets ||
              plan?.type9Stores ||
              plan?.type9Items
            }
          />
        ))}
    </div>
  );
}
