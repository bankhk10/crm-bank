"use client";

import React from "react";
import { Sprout, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ActualTargetsState } from "@/modules/activity-plans/features/actual-view/types";

interface ApprovalType7DemoProps {
  isVisible: boolean;
  workTypeCode?: "TYPE_7A" | "TYPE_7B" | string;
  target: ActualTargetsState["t7"] | any;
}

export function ApprovalType7Demo({
  isVisible,
  workTypeCode,
  target,
}: ApprovalType7DemoProps) {
  if (!isVisible) return null;

  const isFollowUp =
    workTypeCode === "TYPE_7B" ||
    (!workTypeCode &&
      (target.activityType === "FOLLOW_UP" ||
        target.activityType === "FOLLOWUP"));

  const displayCode = isFollowUp ? "TYPE_7B" : "TYPE_7A";
  const displayTitle = isFollowUp ? "ติดตามแปลงสาธิต" : "ทำแปลงสาธิต";

  const categoryLabel = target.categoryName
    ? target.categoryCode
      ? `${target.categoryCode} - ${target.categoryName}`
      : target.categoryName
    : target.chemicalGroupName || "-";

  const areaOrTree = target.areaRai
    ? `${target.areaRai} ไร่`
    : target.treeCount
      ? `${target.treeCount} ต้น`
      : target.plots || "-";

  const locationText = [target.province, target.district]
    .filter(Boolean)
    .join(" / ");

  const demoProducts = target.demoProducts || [];

  return (
    <div className="border border-green-200/80 rounded-2xl p-4 sm:p-5 bg-white space-y-3.5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-green-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0 border border-green-200">
            {isFollowUp ? (
              <Search className="w-4 h-4 text-blue-600" />
            ) : (
              <Sprout className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          <h4 className="font-bold text-green-900 text-sm sm:text-base">
            {displayTitle}
          </h4>
        </div>
        <Badge
          variant="outline"
          className="text-[11px] font-bold bg-green-50 text-green-800 border-green-200"
        >
          {displayCode}
        </Badge>
      </div>

      {!isFollowUp ? (
        // TYPE_7A: ทำแปลงสาธิต
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-green-50/40 p-3 rounded-xl border border-green-100/80 sm:col-span-3">
              <span className="text-green-700 block text-[11px] font-bold mb-1">
                วัตถุประสงค์การทำแปลง
              </span>
              <span className="font-bold text-slate-800 block text-xs sm:text-sm">
                {target.objective ||
                  "ทดสอบและสาธิตประสิทธิภาพผลิตภัณฑ์ในแปลงจริง"}
              </span>
            </div>

            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[11px] font-medium mb-1">
                ชื่อแปลง
              </span>
              <span className="font-bold text-slate-800 block text-xs sm:text-sm">
                {target.plotName || target.owner || "-"}
              </span>
            </div>

            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[11px] font-medium mb-1">
                ร้าน Dealer
              </span>
              <span className="font-bold text-slate-800 block text-xs sm:text-sm">
                {target.dealerName || target.owner || "-"}
              </span>
            </div>

            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[11px] font-medium mb-1">
                จังหวัด / อำเภอ
              </span>
              <span className="font-bold text-slate-800 block text-xs sm:text-sm">
                {locationText || "-"}
              </span>
            </div>

            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[11px] font-medium mb-1">
                หมวดสินค้า
              </span>
              <span className="font-bold text-emerald-700 block text-xs sm:text-sm">
                {categoryLabel}
              </span>
            </div>

            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[11px] font-medium mb-1">
                หมวดพืช & ชื่อพืช
              </span>
              <span className="font-bold text-slate-800 block text-xs sm:text-sm">
                {[target.cropCategory, target.crop]
                  .filter(Boolean)
                  .join(" • ") || "-"}
              </span>
            </div>

            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[11px] font-medium mb-1">
                ขนาดพื้นที่ / จำนวนต้น
              </span>
              <span className="font-bold text-slate-800 block text-xs sm:text-sm">
                {areaOrTree}
              </span>
            </div>
          </div>

          {demoProducts.length > 0 && (
            <div className="mt-3 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-700 block text-[11px] font-bold mb-2">
                สินค้าที่จะสาธิต ({demoProducts.length} รายการ)
              </span>
              <div className="divide-y divide-slate-200/60 text-xs">
                {demoProducts.map((p: any, idx: number) => (
                  <div
                    key={idx}
                    className="py-1.5 flex items-center justify-between"
                  >
                    <span className="font-medium text-slate-800">
                      {idx + 1}. {p.productName || "-"}
                    </span>
                    <span className="font-bold text-emerald-700">
                      {p.quantity} {p.unit || ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        // TYPE_7B: ติดตามแปลงสาธิต
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-green-50/40 p-3 rounded-xl border border-green-100/80 sm:col-span-1">
            <span className="text-green-700 block text-[11px] font-bold mb-1">
              วัตถุประสงค์ของแปลง
            </span>
            <span className="font-bold text-slate-800 block text-xs sm:text-sm">
              {target.objective ||
                "ทดสอบและสาธิตประสิทธิภาพผลิตภัณฑ์ในแปลงจริง"}
            </span>
          </div>

          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              เจ้าของแปลง
            </span>
            <span className="font-bold text-slate-800 block text-xs sm:text-sm">
              {target.owner || "-"}
            </span>
          </div>

          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              พืชปลูก & ผลิตภัณฑ์
            </span>
            <span className="font-bold text-slate-800 block text-xs sm:text-sm">
              {[target.crop, target.product].filter(Boolean).join(" • ") || "-"}
            </span>
          </div>

          {target.plots && (
            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-1">
              <span className="text-slate-500 block text-[11px] font-medium mb-1">
                ขนาดพื้นที่ / จำนวน
              </span>
              <span className="font-bold text-slate-800 block text-xs sm:text-sm">
                {target.plots}
              </span>
            </div>
          )}

          {(target.experimentDetail || target.detail) && (
            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 sm:col-span-2">
              <span className="text-slate-500 block text-[11px] font-medium mb-1">
                รายละเอียด / วิธีการทดลอง
              </span>
              <span className="font-bold text-slate-800 block text-xs sm:text-sm">
                {target.experimentDetail || target.detail}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
