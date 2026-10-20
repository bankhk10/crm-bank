"use client";

import React, { useMemo } from "react";
import { Target } from "lucide-react";
import {
  Type1DetailView,
  type Type1TargetItem,
  type Type1ImageFile,
} from "@/modules/activity/features/type-1";
import { Type2DetailView } from "@/modules/activity/features/type-2";
import { Type3DetailView } from "@/modules/activity/features/type-3";
import { Type4DetailView } from "@/modules/activity/features/type-4";
import { Type5DetailView } from "@/modules/activity/features/type-5";
import { Type6DetailView } from "@/modules/activity/features/type-6";
import { Type7aDetailView } from "@/modules/activity/features/type-7a";
import { Type7bDetailView } from "@/modules/activity/features/type-7b";
import { Type8DetailView } from "@/modules/activity/features/type-8";

interface DetailWorkTypeListProps {
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
 * Component กลางสำหรับแสดงรายละเอียดของประเภทงานในหน้ารายละเอียดแผนงาน (Detail)
 * สอดคล้องกับ ApprovalWorkTypeList และ ActualWorkTypeList โดยยึด Type 1 เป็น Gold Standard
 */
export function DetailWorkTypeList({
  plan,
  targets,
  type1Targets,
  parsedResults,
  isTypeActive,
}: DetailWorkTypeListProps) {
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

  // รวบรวมรูปภาพ (Attachments / Plot Images) สำหรับแสดงผลในการ์ดรายละเอียดงาน
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

  // รวบรวมรูปภาพ Type 2 (Attachments)
  const effectiveT2Images = useMemo(() => {
    if (parsedResults?.t2Images && parsedResults.t2Images.length > 0) {
      return parsedResults.t2Images;
    }
    const rawAttachmentsList: any[] = [
      ...(plan?.attachments || []),
      ...(plan?.result?.attachments || []),
    ];
    const seenIds = new Set<string>();
    const seenUrls = new Set<string>();
    const rawAttachments = rawAttachmentsList.filter((att) => {
      if (!att) return false;
      const attId = att.id;
      const attUrl = att.fileUrl || att.url;
      if (attId && seenIds.has(attId)) return false;
      if (attUrl && seenUrls.has(attUrl)) return false;
      if (attId) seenIds.add(attId);
      if (attUrl) seenUrls.add(attUrl);
      return true;
    });

    return rawAttachments
      .filter(
        (att) =>
          att.workTypeCode === "TYPE_2" ||
          att.category === "PLOT" ||
          (!att.workTypeCode && !att.category),
      )
      .map((att) => ({
        id: att.id,
        url: att.fileUrl || att.url,
        name: att.fileName || att.name || "รูปภาพ",
      }));
  }, [parsedResults?.t2Images, plan?.attachments, plan?.result?.attachments]);

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
      </div>

      {/* 🟢 TYPE 1: เข้าพบเกษตรกร / เข้าพบร้านค้า (Gold Standard Vertical Slice) */}
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

      {/* 🔵 TYPE 2: ติดตามผลการใช้สินค้า (Product Follow-up) */}
      <Type2DetailView
        isVisible={isType2}
        target={targets?.t2}
        targets={targets?.t2List}
        followupResults={parsedResults?.t2FollowupResults}
        customerName={parsedResults?.t2CustomerName}
        detail={parsedResults?.t2Detail}
        followupDetail={parsedResults?.t2FollowupDetail}
        usageResult={parsedResults?.t2UsageResult}
        problemDetail={parsedResults?.t2ProblemDetail}
        images={effectiveT2Images}
      />

      {/* 🟣 TYPE 3: เสนอขายสินค้า (Product Sales Proposal) */}
      <Type3DetailView
        isVisible={isType3}
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

      {/* 🟠 TYPE 4: วางบิล / เก็บเงิน (Billing & Payment Collection) */}
      <Type4DetailView
        isVisible={isType4}
        target={targets?.t4}
        targets={targets?.t4List}
        orderNo={parsedResults?.t4OrderNo}
        receivedAmount={parsedResults?.t4ReceivedAmount}
        billingStatus={parsedResults?.t4BillingStatus}
        billingDetail={parsedResults?.t4BillingDetail}
        collectDetail={parsedResults?.t4CollectDetail}
        paymentImages={effectiveT4Images}
      />

      {/* 🟣 TYPE 5: สำรวจตลาดของคู่แข่ง (Competitor Market Survey) */}
      <Type5DetailView
        isVisible={isType5}
        target={targets?.t5}
        targets={targets?.t5List}
        surveyDetails={parsedResults?.t5SurveyDetails}
        competitorBrand={parsedResults?.t5CompetitorBrand}
        competitorProduct={parsedResults?.t5CompetitorProduct}
      />

      {/* 🔴 TYPE 6: ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา (Customer Complaint / Issue Resolution) */}
      <Type6DetailView
        isVisible={isType6}
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

      {/* 🟢 TYPE 7A: จัดทำแปลงสาธิต (New Demo Plot Creation) */}
      <Type7aDetailView
        isVisible={isType7a}
        target={targets?.t7a || targets?.t7}
        targets={targets?.t7aList || targets?.t7List}
        actualResult={parsedResults}
        attachments={effectiveT7aImages}
      />

      {/* 🟢 TYPE 7B: ติดตามแปลงสาธิต (Demo Plot Follow-up) */}
      <Type7bDetailView
        isVisible={isType7b}
        target={targets?.t7b || targets?.t7bList?.[0]}
        targets={targets?.t7bList}
        actualResult={parsedResults?.type7bActual || parsedResults}
        attachments={effectiveT7bImages}
      />

      {/* 🟢 TYPE 8: จัดประชุม (Meeting) */}
      <Type8DetailView
        isVisible={isType8}
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
    </div>
  );
}
