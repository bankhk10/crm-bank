"use client";

import React from "react";
import { Search, PackageCheck, Target, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Type7bPlanCardProps, Type7bPlanCardTarget } from "../types/planned.types";

export function Type7bPlanCard({
  target,
  targets = [],
  planType,
  className = "",
}: Type7bPlanCardProps) {
  if (planType === "UNPLANNED") return null;

  const resolvedTargets: Type7bPlanCardTarget[] =
    targets.length > 0 ? targets : target ? [target] : [];

  if (resolvedTargets.length === 0) return null;

  return (
    <div className={`space-y-3.5 ${className}`}>
      {resolvedTargets.map((item, idx) => {
        const demoProducts = item.demoProducts || item.withdrawnProducts || [];
        const objective =
          item.followUpObjective ||
          item.detail ||
          item.t7bObjective ||
          item.objective ||
          "";
        const plotName = item.plotName || item.owner || "";

        return (
          <div
            key={item.id || idx}
            className="bg-white border border-blue-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-blue-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
                  <Search className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-blue-950 text-sm sm:text-base">
                  ข้อมูลตามแผนงาน: ติดตามแปลงสาธิต {resolvedTargets.length > 1 ? `#${idx + 1}` : ""}
                </h4>
              </div>
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-800 border-blue-200 text-[11px] font-semibold px-2.5 py-0.5"
              >
                ข้อมูลตามแผนงาน (PLAN)
              </Badge>
            </div>

            {/* Grid Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {plotName ? (
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block text-[11px] font-medium mb-1">
                    แปลงสาธิตเป้าหมาย
                  </span>
                  <span className="font-bold text-slate-800 block text-xs sm:text-sm">
                    {plotName}
                  </span>
                </div>
              ) : null}

              {item.crop ? (
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block text-[11px] font-medium mb-1">
                    พืชเป้าหมาย
                  </span>
                  <span className="font-bold text-slate-800 block text-xs sm:text-sm">
                    {item.crop}
                  </span>
                </div>
              ) : null}

              {item.owner && item.owner !== plotName ? (
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block text-[11px] font-medium mb-1">
                    เจ้าของแปลง
                  </span>
                  <span className="font-bold text-slate-800 block text-xs sm:text-sm">
                    {item.owner}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Objective */}
            {objective ? (
              <div className="bg-blue-50/40 p-3 rounded-xl border border-blue-100/70 text-xs flex items-start gap-2">
                <Target className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <span className="font-semibold text-blue-950 block text-[11px]">
                    สิ่งที่ตั้งใจจะไปติดตาม
                  </span>
                  <p className="text-slate-700 leading-relaxed text-xs">{objective}</p>
                </div>
              </div>
            ) : null}

            {/* Withdrawn Products */}
            {demoProducts && demoProducts.length > 0 && (
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>สินค้าสาธิตที่ขอเบิกเพื่อการติดตาม ({demoProducts.length} รายการ)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {demoProducts.map((p, pIdx) => (
                    <div
                      key={p.id || pIdx}
                      className="bg-emerald-50 text-emerald-900 border border-emerald-200/80 rounded-lg px-2.5 py-1 text-xs flex items-center gap-1.5"
                    >
                      <span className="font-medium">{p.productName || p.product?.name || "สินค้า"}</span>
                      <span className="text-[11px] bg-white px-1.5 py-0.2 rounded border border-emerald-200 font-bold text-emerald-700">
                        {p.quantity || p.targetQuantity || 1} {p.unit || p.product?.unit || "หน่วย"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
