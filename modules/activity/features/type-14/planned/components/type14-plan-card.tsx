"use client";

import React from "react";
import { Layers, MapPin, PackageCheck, Sprout } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Type14PlotItem } from "../../shared/types";
import type { Type14PlanCardProps } from "../types/planned.types";

export type { Type14PlanCardProps };

export function Type14PlanCard({
  data,
  plots: propPlots = [],
  planSummary,
  planType,
  className = "",
}: Type14PlanCardProps & { plots?: Type14PlotItem[] }) {
  if (planType === "UNPLANNED") return null;

  const plots: Type14PlotItem[] =
    propPlots.length > 0
      ? propPlots
      : data?.plots && data.plots.length > 0
        ? data.plots
        : data?.name
          ? [
              {
                id: data.demoPlotId || "plot-1",
                name: data.name,
                plotName: data.name,
                storeId: data.storeId || "",
                dealerName: data.dealerName || null,
                ownerName: data.ownerName || null,
                cropCategory: data.cropCategory || null,
                cropName: data.cropName || null,
                areaRai: data.areaRai != null ? Number(data.areaRai) : null,
                treeCount: data.treeCount != null ? Number(data.treeCount) : null,
                province: data.province || "",
                district: data.district || "",
              },
            ]
          : [];

  if (plots.length === 0) return null;

  const withdrawnProducts = data?.withdrawnProducts || [];

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
            แผนงานติดตามแปลงแฮทแทค (Type 14)
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
                  {plot.name || plot.plotName || `แปลงที่ ${idx + 1}`}
                </span>
                {plot.dealerName && (
                  <span className="text-xs text-slate-600 font-medium">
                    (ร้านค้า: {plot.dealerName})
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
                    [planSummary?.district, planSummary?.province]
                      .filter(Boolean)
                      .join(", ") ||
                    "-"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
              {plot.ownerName && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
                  <span className="text-slate-400">เกษตรกร:</span>
                  <span className="font-semibold text-slate-800">
                    {plot.ownerName}
                  </span>
                </span>
              )}

              {(plot.cropName || plot.cropCategory) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
                  <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {[plot.cropCategory, plot.cropName]
                      .filter(Boolean)
                      .join(" - ")}
                  </span>
                </span>
              )}

              {plot.areaRai != null && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
                  <span className="text-slate-400">พื้นที่:</span>
                  <span className="font-semibold text-slate-800">
                    {plot.areaRai} ไร่
                  </span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Withdrawn Products if present */}
      {withdrawnProducts.length > 0 && (
        <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/30 p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-950">
            <PackageCheck className="w-4 h-4 text-emerald-600" />
            <span>รายการสินค้าเบิกติดตามแปลง ({withdrawnProducts.length} รายการ)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {withdrawnProducts.map((p, pIdx) => (
              <div
                key={p.id || pIdx}
                className="flex items-center justify-between rounded-lg bg-white px-3 py-1.5 border border-slate-200"
              >
                <span className="font-medium text-slate-800">
                  {p.productName || `สินค้า ID: ${p.productId}`}
                </span>
                <span className="font-semibold text-emerald-700">
                  {p.quantity} {p.unit || "ขวด"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
