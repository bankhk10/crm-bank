"use client";

import React from "react";
import { Sprout } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ActualTargetsState } from "@/modules/activity-plans/features/shared/actual-view/types";

export interface ApprovalType7aDemoProps {
  isVisible: boolean;
  target: ActualTargetsState["t7"] | any;
}

export function ApprovalType7aDemo({
  isVisible,
  target,
}: ApprovalType7aDemoProps) {
  if (!isVisible) return null;

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
            <Sprout className="w-4 h-4 text-emerald-600" />
          </div>
          <h4 className="font-bold text-green-900 text-sm sm:text-base">
            ทำแปลงสาธิต
          </h4>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              ชื่อแปลง
            </span>
            <span className="font-medium block text-xs sm:text-sm">
              {target.plotName || target.owner || "-"}
            </span>
          </div>

          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              ร้าน Dealer
            </span>
            <span className="font-medium block text-xs sm:text-sm">
              {target.dealerName || target.owner || "-"}
            </span>
          </div>

          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              จังหวัด / อำเภอ
            </span>
            <span className="font-medium block text-xs sm:text-sm">
              {locationText || "-"}
            </span>
          </div>

          <div className="bg-green-50/40 p-3 rounded-xl border border-green-100/80 sm:col-span-3">
            <span className="text-green-700 block text-[11px] mb-1 font-medium">
              วัตถุประสงค์การทำแปลง
            </span>
            <span className="font-medium block text-xs sm:text-sm">
              {target.objective || ""}
            </span>
          </div>

          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              หมวดสินค้า
            </span>
            <span className="font-medium block text-xs sm:text-sm">
              {categoryLabel}
            </span>
          </div>

          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              หมวดพืช & ชื่อพืช
            </span>
            <span className="font-medium block text-xs sm:text-sm">
              {[target.cropCategory, target.crop].filter(Boolean).join(" • ") ||
                "-"}
            </span>
          </div>

          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[11px] font-medium mb-1">
              ขนาดพื้นที่ / จำนวนต้น
            </span>
            <span className="font-medium block text-xs sm:text-sm">
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
    </div>
  );
}
