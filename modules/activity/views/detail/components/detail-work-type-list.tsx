"use client";

import React, { useMemo } from "react";
import { Target } from "lucide-react";
import {
  Type1DetailView,
  type Type1TargetItem,
  type Type1ImageFile,
} from "@/modules/activity/features/type-1";

interface DetailWorkTypeListProps {
  plan?: any;
  targets?: any;
  type1Targets: {
    primary: Type1TargetItem;
    list: Type1TargetItem[];
  };
  parsedResults?: any;
  isTypeActive: (code: string, label: string) => boolean;
  t7DemoPlotData?: any;
  t7VisitHistory?: any[];
}

/**
 * Component กลางสำหรับแสดงรายละเอียดของประเภทงานในหน้ารายละเอียดแผนงาน (Detail)
 * สอดคล้องกับ ApprovalWorkTypeList และ ActualWorkTypeList โดยยึด Type 1 เป็น Gold Standard
 */
export function DetailWorkTypeList({
  plan,
  type1Targets,
  parsedResults,
  isTypeActive,
}: DetailWorkTypeListProps) {
  const isType1 =
    isTypeActive("TYPE_1", "เข้าพบเกษตรกร") ||
    isTypeActive("TYPE_1", "เข้าพบร้านค้า / Key Farmer");

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

      {/* 🔵 ประเภทงานอื่นๆ (Type 2 - 14) จะเพิ่มเข้ามาเมื่อเริ่มพัฒนา Feature แต่ละประเภทงาน */}
    </div>
  );
}
