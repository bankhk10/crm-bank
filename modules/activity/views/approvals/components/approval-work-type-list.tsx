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

      {/* 🔵 ประเภทงานอื่นๆ (Type 4 - 14) จะเพิ่มเข้ามาเมื่อเริ่มพัฒนา Feature แต่ละประเภทงาน */}
    </div>
  );
}
