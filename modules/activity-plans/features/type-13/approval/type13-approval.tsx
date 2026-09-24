"use client";

import React, { useMemo } from "react";
import { Layers, MapPin, Package, Store } from "lucide-react";
import type { Type13PlotItem } from "../../../application/validations";

export interface Type13ApprovalProps {
  plots: Type13PlotItem[];
  planSummary?: {
    province?: string | null;
    district?: string | null;
  };
}

export function Type13Approval({ plots = [], planSummary }: Type13ApprovalProps) {
  // Computed Roll-up across all plots
  const rollUpSummary = useMemo(() => {
    const map = new Map<string, { productId: string; productName: string; quantity: number; unit?: string }>();

    plots.forEach((plot) => {
      (plot.products || []).forEach((prod) => {
        if (!prod.productId && !prod.productName) return;
        const key = prod.productId || prod.productName || "unknown";
        const existing = map.get(key);
        const qty = Number(prod.quantity) || 0;
        if (existing) {
          existing.quantity += qty;
        } else {
          map.set(key, {
            productId: prod.productId,
            productName: prod.productName || "สินค้าไม่ระบุชื่อ",
            quantity: qty,
            unit: prod.unit || undefined,
          });
        }
      });
    });

    return Array.from(map.values());
  }, [plots]);

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

            {/* Products Table for this plot */}
            <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                <Package className="w-3 h-3 text-emerald-600" />
                <span>รายการตัวยา/สินค้า:</span>
              </div>
              <div className="space-y-1">
                {(plot.products || []).map((prod, pIdx) => (
                  <div
                    key={prod.id || pIdx}
                    className="flex items-center justify-between text-xs py-1 px-2 bg-white rounded border border-slate-100"
                  >
                    <span className="text-slate-700 font-medium">
                      {prod.productName || "สินค้าไม่ระบุชื่อ"}
                    </span>
                    <span className="font-bold text-emerald-600">
                      {Number(prod.quantity).toLocaleString()} {prod.unit || "หน่วย"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Roll-up Summary Table */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
        <h6 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 text-emerald-600" />
          <span>สรุปรายการตัวยารวมทั้งหมด (Computed Roll-up)</span>
        </h6>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-medium">
                <th className="py-1.5 px-2 w-10 text-center">ลำดับ</th>
                <th className="py-1.5 px-2">ชื่อสินค้า/ตัวยา</th>
                <th className="py-1.5 px-2 text-right">จำนวนรวม</th>
                <th className="py-1.5 px-2 w-16">หน่วย</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rollUpSummary.map((item, idx) => (
                <tr key={item.productId || idx}>
                  <td className="py-1.5 px-2 text-center text-slate-400">
                    {idx + 1}
                  </td>
                  <td className="py-1.5 px-2 font-medium text-slate-700">
                    {item.productName}
                  </td>
                  <td className="py-1.5 px-2 text-right font-bold text-emerald-600">
                    {item.quantity.toLocaleString()}
                  </td>
                  <td className="py-1.5 px-2 text-slate-500">
                    {item.unit || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Type13Approval;
