"use client";

import React from "react";
import { Layers, MapPin, Package } from "lucide-react";
import type { Type13PlotItem } from "../shared/types";
import type { Type13ApprovalProps } from "./types";

export type { Type13ApprovalProps };

export function Type13Approval({ plots = [], planSummary }: Type13ApprovalProps) {
  if (!plots || plots.length === 0) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
        ไม่มีข้อมูลแปลงแฮตแทค
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Badge */}
      <div className="flex items-center justify-between p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-100">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-600" />
          <h5 className="font-bold text-slate-800 text-xs sm:text-sm">
            แปลงแฮตแทค (TYPE_13)
          </h5>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
          ทั้งหมด {plots.length} แปลง
        </span>
      </div>

      {/* Plots Breakdown */}
      <div className="grid grid-cols-1 gap-3.5">
        {plots.map((plot, idx) => (
          <div
            key={plot.id || idx}
            className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="font-bold text-xs sm:text-sm text-slate-800">
                  {plot.name || `แปลงที่ ${idx + 1}`}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>
                  {[plot.district, plot.province].filter(Boolean).join(", ") ||
                    [planSummary?.district, planSummary?.province].filter(Boolean).join(", ") ||
                    "-"}
                </span>
              </div>
            </div>

            {/* Drug Withdrawal for this plot */}
            {plot.hasDrugWithdrawal &&
            plot.withdrawalItems &&
            plot.withdrawalItems.length > 0 ? (
              <div className="bg-emerald-50/50 rounded-lg p-2.5 border border-emerald-100">
                <div className="text-[11px] font-semibold text-emerald-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-emerald-600" />
                    <span>การเบิกยา (Drug Withdrawal):</span>
                  </span>
                  <span className="text-[10px] font-medium bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {plot.withdrawalItems.length} รายการ
                  </span>
                </div>
                <div className="space-y-1">
                  {plot.withdrawalItems.map((item, pIdx) => (
                    <div
                      key={item.id || pIdx}
                      className="flex items-center justify-between text-xs py-1 px-2.5 bg-white rounded border border-emerald-100"
                    >
                      <span className="text-slate-800 font-medium">
                        {item.productName || "สินค้าไม่ระบุชื่อ"}
                      </span>
                      <span className="font-bold text-emerald-700">
                        {Number(item.quantity).toLocaleString()} {item.unit || "หน่วย"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 flex items-center justify-between">
                <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-slate-400" />
                  <span>การเบิกยา (Drug Withdrawal):</span>
                </div>
                <span className="text-[11px] font-medium text-slate-400 italic">
                  ไม่มีการเบิกยาสำหรับแปลงนี้
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Type13Approval;
