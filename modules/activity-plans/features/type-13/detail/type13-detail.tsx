"use client";

import React, { useState } from "react";
import { MapPin, Package, ExternalLink } from "lucide-react";
import type { Type13PlotItem } from "../shared/types";
import type { Type13DetailProps } from "./types";

export type { Type13DetailProps };

export function Type13Detail({ plots = [], planSummary }: Type13DetailProps) {
  const [activePlotIdx, setActivePlotIdx] = useState(0);

  if (!plots || plots.length === 0) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
        ไม่มีข้อมูลแปลงแฮตแทค
      </div>
    );
  }

  const currentPlot = plots[activePlotIdx] || plots[0];

  const plotCoord =
    currentPlot.latitude && currentPlot.longitude
      ? { latitude: currentPlot.latitude, longitude: currentPlot.longitude }
      : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 space-y-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
            13
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <span>แปลงแฮตแทค (TYPE_13)</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                ทั้งหมด {plots.length} แปลง
              </span>
            </h4>
            <p className="text-xs text-slate-500">
              รายละเอียดแปลงและรายการสินค้าสำหรับกิจกรรม
            </p>
          </div>
        </div>
      </div>

      {/* Plot Tabs (if multiple) */}
      {plots.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {plots.map((plot, pIdx) => {
            const isActive = pIdx === activePlotIdx;
            return (
              <button
                key={plot.id || pIdx}
                type="button"
                onClick={() => setActivePlotIdx(pIdx)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                  isActive
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span>{plot.name || `แปลงที่ ${pIdx + 1}`}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Current Plot Card */}
      <div className="bg-slate-50/60 rounded-2xl border border-slate-200/80 p-4 sm:p-5 space-y-5">
        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200">
          <div>
            <span className="block text-[11px] text-slate-400 font-medium">
              ชื่อแปลง
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-800">
              {currentPlot.name}
            </span>
          </div>

          <div>
            <span className="block text-[11px] text-slate-400 font-medium">
              ร้านค้า Dealer
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-800">
              {currentPlot.dealerName || currentPlot.ownerName || "-"}
            </span>
            {(currentPlot.district || currentPlot.province) && (
              <span className="text-[11px] text-slate-500 block truncate">
                {[currentPlot.district, currentPlot.province]
                  .filter(Boolean)
                  .join(" / ")}
              </span>
            )}
          </div>
          {/* ยังไม่ได้ใช้งาน ที่ตั้งแปลง */}
          {/* <div>
            <span className="block text-[11px] text-slate-400 font-medium">ที่ตั้งแปลง</span>
            <span className="text-xs sm:text-sm font-semibold text-slate-700 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {[currentPlot.district, currentPlot.province].filter(Boolean).join(", ") ||
                [planSummary?.district, planSummary?.province].filter(Boolean).join(", ") ||
                "-"}
            </span>
          </div> */}

          {plotCoord && (
            <div className="sm:col-span-2 md:col-span-3 pt-2 border-t border-slate-100 flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium">
                พิกัด GPS:
              </span>
              <span className="text-xs font-mono font-bold text-slate-800">
                {String(plotCoord.latitude)}, {String(plotCoord.longitude)}
              </span>
              <a
                href={`https://maps.google.com/?q=${plotCoord.latitude},${plotCoord.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 underline"
              >
                <span>เปิดดูในแผนที่</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Products in this plot if any */}
        {currentPlot.products && currentPlot.products.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              <h6 className="font-bold text-xs text-slate-800">
                รายการสินค้าที่วางแผนสำหรับแปลงนี้
              </h6>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-medium">
                    <th className="py-2 px-3 w-12 text-center">ลำดับ</th>
                    <th className="py-2 px-3">ชื่อสินค้า</th>
                    <th className="py-2 px-3 text-center">จำนวน</th>
                    <th className="py-2 px-3 w-20">หน่วย</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentPlot.products.map((item, pIdx) => (
                    <tr key={item.productId || pIdx} className="hover:bg-slate-50/60">
                      <td className="py-2 px-3 text-center text-slate-400">
                        {pIdx + 1}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-700">
                        {item.productName || "สินค้าไม่ระบุชื่อ"}
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-emerald-600">
                        {item.quantity ?? "-"}
                      </td>
                      <td className="py-2 px-3 text-slate-500">
                        {item.unit || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Type13Detail;
