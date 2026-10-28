"use client";

import React from "react";
import { Layers, MapPin, PackageCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Type13PlanCardProps } from "../types/planned.types";

export type { Type13PlanCardProps };

export function Type13PlanCard({
  plots = [],
  planSummary,
  planType,
  className = "",
}: Type13PlanCardProps) {
  if (planType === "UNPLANNED" || !plots || plots.length === 0) return null;

  return (
    <div
      className={`bg-white border border-emerald-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
            <Layers className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-emerald-950 text-sm sm:text-base">
            ข้อมูลตามแผนงาน: แปลงแฮตแทค
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[11px] font-semibold px-2.5 py-0.5"
          >
            ทั้งหมด {plots.length} แปลง
          </Badge>
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[11px] font-semibold px-2.5 py-0.5"
          >
            ข้อมูลตามแผนงาน (PLAN)
          </Badge>
        </div>
      </div>

      {/* Plots Breakdown */}
      <div className="grid grid-cols-1 gap-3.5">
        {plots.map((plot, idx) => (
          <div
            key={plot.id || idx}
            className="p-3.5 sm:p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="font-bold text-xs sm:text-sm text-slate-800">
                  {plot.name || `แปลงที่ ${idx + 1}`}
                </span>
                {plot.ownerName && (
                  <span className="text-xs text-slate-600 font-medium">
                    (ร้านค้า: {plot.ownerName})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {[
                    plot.subdistrict ? `ต.${plot.subdistrict}` : null,
                    plot.district ? `อ.${plot.district}` : null,
                    plot.province ? `จ.${plot.province}` : null,
                  ]
                    .filter(Boolean)
                    .join(" ") ||
                    [planSummary?.district, planSummary?.province].filter(Boolean).join(", ") ||
                    "-"}
                </span>
              </div>
            </div>

            {(plot.village || plot.plannedPlotsCount || plot.objective) && (
              <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                {plot.objective && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
                    <span className="text-slate-400">วัตถุประสงค์:</span>
                    <span className="font-semibold text-slate-800">{plot.objective}</span>
                  </span>
                )}
                {plot.village && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
                    <span className="text-slate-400">หมู่บ้าน:</span>
                    <span className="font-semibold text-slate-800">{plot.village}</span>
                  </span>
                )}
                {plot.plannedPlotsCount != null && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
                    <span className="text-emerald-600">เป้าหมายตามแผน:</span>
                    <span className="font-bold">{plot.plannedPlotsCount} แปลง</span>
                  </span>
                )}
              </div>
            )}

            {plot.hasProductWithdrawal &&
              plot.withdrawnProducts &&
              plot.withdrawnProducts.length > 0 && (
                <div className="pt-2 border-t border-slate-200/60 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                    <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                    สินค้าที่ขอเบิก ({plot.withdrawnProducts.length} รายการ):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {plot.withdrawnProducts.map((p, pIdx) => (
                      <span
                        key={p.id || pIdx}
                        className="inline-flex items-center gap-1 text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700"
                      >
                        <span>{p.productName || "สินค้า"}</span>
                        <span className="font-bold text-emerald-700">
                          {p.quantity} {p.unit || "ขวด"}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>
        ))}
      </div>
    </div>
  );
}
