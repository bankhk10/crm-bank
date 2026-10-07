"use client";

import React from "react";
import { Layers, MapPin, Package, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Type13PlotItem } from "./types";

export interface Type13PlanCardProps {
  plots?: Type13PlotItem[];
  planSummary?: {
    province?: string | null;
    district?: string | null;
  };
  planType?: string;
  className?: string;
}

export function Type13PlanCard({
  plots = [],
  planSummary,
  planType,
  className = "",
}: Type13PlanCardProps) {
  if (planType === "UNPLANNED" || !plots || plots.length === 0) return null;

  return (
    <div
      className={`bg-white border border-emerald-200/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs ${className}`}
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
                  {[plot.district, plot.province].filter(Boolean).join(", ") ||
                    [planSummary?.district, planSummary?.province].filter(Boolean).join(", ") ||
                    "-"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
