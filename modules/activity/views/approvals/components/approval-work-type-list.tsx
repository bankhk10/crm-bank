"use client";

import React, { useMemo } from "react";
import { Target } from "lucide-react";
import { Type1ApprovalCard, type Type1TargetItem } from "@/modules/activity/features/type-1";
import {
  ApprovalType2Followup,
  ApprovalType3Sales,
  ApprovalType4Collect,
  ApprovalType5Survey,
  ApprovalType6Issue,
  ApprovalType7Demo,
  ApprovalType8Meeting,
  ApprovalType9Store,
  ApprovalType10FieldDay,
  ApprovalType11Stock,
  ApprovalType12Tour,
} from "./work-types";
import { Type13Approval, type Type13PlotItem } from "@/modules/activity-plans/features/type-13";
import { Type14Approval, type Type14PlanInput } from "@/modules/activity-plans/features/type-14";
import type { ActualTargetsState, ParsedSummaryValues } from "../../actual/types";

interface ApprovalWorkTypeListProps {
  plan: any;
  targets: ActualTargetsState;
  type1Targets: {
    primary: Type1TargetItem;
    list: Type1TargetItem[];
  };
  parsedResults: ParsedSummaryValues;
  isTypeActive: (code: string, label: string) => boolean;
}

export function ApprovalWorkTypeList({
  plan,
  targets,
  type1Targets,
  parsedResults,
  isTypeActive,
}: ApprovalWorkTypeListProps) {
  // Extract Type 13 Plots if present
  const type13Plots: Type13PlotItem[] = useMemo(() => {
    const plotMap = new Map<string, Type13PlotItem>();

    if (plan?.type13?.plots && plan.type13.plots.length > 0) {
      const type13Products = (plan.type13.products || []).map((prod: any) => ({
        productId: prod.productId,
        productName: prod.product?.name || prod.productName || "",
        quantity: Number(prod.quantity) || 1,
        unit: prod.unit || prod.product?.unit || prod.product?.packageSizeUnit || "ขวด",
      }));

      plan.type13.plots.forEach((p: any, idx: number) => {
        const key = p.demoPlotId || p.id || `plot-${idx}`;
        plotMap.set(key, {
          id: p.id,
          demoPlotId: p.demoPlotId || p.id,
          name: p.plotName || p.name || `แปลงที่ ${idx + 1}`,
          storeId: p.storeId || p.store?.id || "",
          dealerName: p.dealerName || p.store?.name || p.ownerName || "",
          ownerName: p.ownerName || p.dealerName || p.store?.name || "",
          province: p.province || p.store?.province || "",
          district: p.district || p.store?.district || "",
          latitude: p.latitude != null ? String(p.latitude) : "",
          longitude: p.longitude != null ? String(p.longitude) : "",
          products: type13Products,
        });
      });
    }

    return Array.from(plotMap.values());
  }, [plan]);

  const type14Data: Type14PlanInput | null = useMemo(() => {
    if (!plan?.type14) return null;
    return plan.type14 as Type14PlanInput;
  }, [plan]);

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

      {/* 🟢 TYPE 1: เข้าพบเกษตรกร / ร้านค้า (Gold Standard Vertical Slice) */}
      <Type1ApprovalCard
        isVisible={
          isTypeActive("TYPE_1", "เข้าพบเกษตรกร") ||
          isTypeActive("TYPE_1", "เข้าพบร้านค้า / Key Farmer")
        }
        target={type1Targets.primary}
        targets={type1Targets.list}
      />

      {/* TYPE 2: ติดตามผลการใช้สินค้า */}
      <ApprovalType2Followup
        isVisible={isTypeActive("TYPE_2", "ติดตามผลการใช้สินค้า")}
        target={targets.t2}
        targets={targets.t2List}
      />

      {/* TYPE 3: เสนอขายสินค้า */}
      <ApprovalType3Sales
        isVisible={isTypeActive("TYPE_3", "เสนอขายสินค้า")}
        target={targets.t3}
        targets={targets.t3List}
      />

      {/* TYPE 4: วางบิล / เก็บเงิน */}
      <ApprovalType4Collect
        isVisible={isTypeActive("TYPE_4", "วางบิล / เก็บเงิน")}
        target={targets.t4}
        targets={targets.t4List}
        actualCollectAmount={
          parsedResults.t4ReceivedAmount != null &&
          parsedResults.t4ReceivedAmount !== ""
            ? Number(parsedResults.t4ReceivedAmount.replace(/,/g, ""))
            : plan?.result?.collectResultAmount != null
              ? Number(plan.result.collectResultAmount)
              : undefined
        }
      />

      {/* TYPE 5: สำรวจตลาดของคู่แข่ง */}
      <ApprovalType5Survey
        isVisible={isTypeActive("TYPE_5", "สำรวจตลาดของคู่แข่ง")}
        target={targets.t5}
        targets={targets.t5List}
      />

      {/* TYPE 6: ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา */}
      <ApprovalType6Issue
        isVisible={isTypeActive("TYPE_6", "ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา")}
        target={targets.t6}
        targets={targets.t6List}
      />

      {/* TYPE 7A: ทำแปลงสาธิต */}
      <ApprovalType7Demo
        isVisible={isTypeActive("TYPE_7A", "ทำแปลงสาธิต")}
        workTypeCode="TYPE_7A"
        target={targets.t7a || targets.t7}
        targets={targets.t7aList}
      />

      {/* TYPE 7B: ติดตามแปลงสาธิต */}
      <ApprovalType7Demo
        isVisible={isTypeActive("TYPE_7B", "ติดตามแปลงสาธิต")}
        workTypeCode="TYPE_7B"
        target={targets.t7b || targets.t7}
        targets={targets.t7bList}
      />

      {/* TYPE 8: จัดประชุม */}
      <ApprovalType8Meeting
        isVisible={isTypeActive("TYPE_8", "จัดประชุม / อบรมเกษตรกร")}
        target={targets.t8}
        targets={targets.t8List}
      />

      {/* TYPE 9: กิจกรรมร้านค้า */}
      <ApprovalType9Store
        isVisible={isTypeActive("TYPE_9", "กิจกรรมส่งเสริมการขายร่วมกับร้านค้า")}
        target={targets.t9}
        targets={targets.t9List}
      />

      {/* TYPE 10: งานวันถ่ายทอดเทคโนโลยี */}
      <ApprovalType10FieldDay
        isVisible={isTypeActive("TYPE_10", "งานวันถ่ายทอดเทคโนโลยี (Field Day)")}
        target={targets.t10}
        targets={targets.t10List}
      />

      {/* TYPE 11: ตรวจนับสต๊อกร้านค้า */}
      <ApprovalType11Stock
        isVisible={isTypeActive("TYPE_11", "ตรวจนับสต๊อกร้านค้า")}
        target={targets.t11}
        targets={targets.t11List}
      />

      {/* TYPE 12: พาลูกค้าทัวร์ */}
      <ApprovalType12Tour
        isVisible={isTypeActive("TYPE_12", "พาลูกค้าทัวร์")}
        target={targets.t12}
        targets={targets.t12List}
      />

      {/* TYPE 13: แปลงสาธิตแฮทแทค */}
      {isTypeActive("TYPE_13", "ทำแปลงสาธิตแฮทแทค") && type13Plots.length > 0 && (
        <Type13Approval
          plots={type13Plots}
          planSummary={{
            province: plan.province,
            district: plan.district,
          }}
        />
      )}

      {/* TYPE 14: ติดตามแปลงแฮทแทค */}
      {isTypeActive("TYPE_14", "ติดตามแปลงแฮทแทค") && type14Data && (
        <Type14Approval
          data={type14Data}
          planSummary={{
            province: plan.province,
            district: plan.district,
          }}
        />
      )}
    </div>
  );
}
