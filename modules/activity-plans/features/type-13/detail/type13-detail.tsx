"use client";

import React, { useMemo, useState } from "react";
import {
  Layers,
  MapPin,
  Package,
  Beaker,
  CheckCircle2,
  Calendar,
  ExternalLink,
  Camera,
  Eye,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Type13PlotItem } from "../../../application/validations";

export interface Type13DetailProps {
  plots: Type13PlotItem[];
  planSummary?: {
    province?: string | null;
    district?: string | null;
  };
  actualData?: {
    type13PlotsActual?: Array<{ demoPlotId: string; latitude: any; longitude: any }>;
    sprayRounds?: Array<{
      demoPlotId: string;
      roundNumber: number;
      sprayDate: any;
      sprayMethod: string;
      sprayEquipment: string;
      otherEquipment?: string | null;
      productResponse: string;
      problemDetail?: string | null;
      products: Array<{
        productId: string;
        productName?: string | null;
        actualRate: string;
        quantityUsed: any;
        unit?: string | null;
      }>;
      externalProducts?: Array<{
        company: string;
        productName: string;
        activeIngredient?: string | null;
        formula: string;
        customFormula?: string | null;
        applicationRate: string;
      }>;
      attachments?: Array<{
        fileUrl: string;
        fileName?: string;
      }>;
    }>;
  };
}

export function Type13Detail({ plots = [], planSummary, actualData }: Type13DetailProps) {
  const [activePlotIdx, setActivePlotIdx] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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

  const currentPlot = plots[activePlotIdx] || plots[0];

  // Check if this plot has actual coordinates
  const plotCoord = actualData?.type13PlotsActual?.find(
    (c) => c.demoPlotId === currentPlot.id,
  );

  // Check if this plot has spray rounds
  const plotRounds = (actualData?.sprayRounds || []).filter(
    (r) => r.demoPlotId === currentPlot.id,
  );

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
              รายละเอียดแปลงและผลการฉีดพ่นสารเคมี
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
            <span className="block text-[11px] text-slate-400 font-medium">ชื่อแปลง</span>
            <span className="text-xs sm:text-sm font-bold text-slate-800">
              {currentPlot.name}
            </span>
          </div>

          <div>
            <span className="block text-[11px] text-slate-400 font-medium">ร้านค้า Dealer</span>
            <span className="text-xs sm:text-sm font-semibold text-slate-700">
              {currentPlot.ownerName || currentPlot.storeId || "-"}
            </span>
          </div>

          <div>
            <span className="block text-[11px] text-slate-400 font-medium">ที่ตั้งแปลง</span>
            <span className="text-xs sm:text-sm font-semibold text-slate-700 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {[currentPlot.district, currentPlot.province].filter(Boolean).join(", ") ||
                [planSummary?.district, planSummary?.province].filter(Boolean).join(", ") ||
                "-"}
            </span>
          </div>

          {plotCoord && (
            <div className="sm:col-span-2 md:col-span-3 pt-2 border-t border-slate-100 flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium">พิกัด GPS:</span>
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

        {/* Products in this plot */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-600" />
            <h6 className="font-bold text-xs text-slate-800">
              รายการตัวยา/สินค้าสำหรับแปลงนี้ ({currentPlot.products?.length || 0} รายการ)
            </h6>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-medium">
                  <th className="py-2 px-3 w-12 text-center">ลำดับ</th>
                  <th className="py-2 px-3">ชื่อสินค้า/ตัวยา</th>
                  <th className="py-2 px-3 text-right">จำนวน</th>
                  <th className="py-2 px-3 w-20">หน่วย</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(currentPlot.products || []).map((prod, pIdx) => (
                  <tr key={prod.id || pIdx} className="hover:bg-slate-50/60">
                    <td className="py-2 px-3 text-center text-slate-400">
                      {pIdx + 1}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-700">
                      {prod.productName || "สินค้าไม่ระบุชื่อ"}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-600">
                      {Number(prod.quantity).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-slate-500">
                      {prod.unit || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actual Spraying Rounds (if recorded) */}
        {plotRounds.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <Beaker className="w-4 h-4 text-emerald-600" />
              <h6 className="font-bold text-xs sm:text-sm text-slate-800">
                ประวัติการฉีดพ่นจริง ({plotRounds.length} รอบ)
              </h6>
            </div>

            <div className="space-y-3">
              {plotRounds.map((round, rIdx) => (
                <div
                  key={rIdx}
                  className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                        {round.roundNumber}
                      </span>
                      <span className="font-bold text-xs text-slate-800">
                        รอบที่ {round.roundNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          round.sprayMethod === "TANK_MIXED"
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {round.sprayMethod === "TANK_MIXED" ? "ผสมถัง" : "ฉีดเดี่ยว"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {round.sprayDate
                          ? new Date(round.sprayDate).toLocaleDateString("th-TH")
                          : "-"}
                      </span>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">อุปกรณ์</span>
                      <span className="font-medium text-slate-700">
                        {round.sprayEquipment}
                        {round.otherEquipment ? ` (${round.otherEquipment})` : ""}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">ผลหลังฉีด</span>
                      <span className="font-semibold text-emerald-600">
                        {round.productResponse}
                      </span>
                    </div>
                    {round.problemDetail && (
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-slate-400 block text-[11px]">ปัญหาที่พบ</span>
                        <span className="font-medium text-rose-600">
                          {round.problemDetail}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Spray Products */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      สินค้าที่ใช้จริง:
                    </span>
                    <div className="space-y-1">
                      {round.products.map((p, pIdx) => (
                        <div
                          key={pIdx}
                          className="flex items-center justify-between text-xs py-1 px-2.5 bg-slate-50 rounded border border-slate-100"
                        >
                          <span className="font-medium text-slate-700">
                            {p.productName || "สินค้าไม่ระบุชื่อ"}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-500">
                              อัตรา: {p.actualRate || "-"}
                            </span>
                            <span className="font-bold text-emerald-600">
                              {Number(p.quantityUsed).toLocaleString()} {p.unit || "หน่วย"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tank-mixed External Chemicals */}
                  {round.sprayMethod === "TANK_MIXED" &&
                    round.externalProducts &&
                    round.externalProducts.length > 0 && (
                      <div className="space-y-1 pt-2 border-t border-slate-100">
                        <span className="text-[11px] font-semibold text-indigo-700 block">
                          สารเคมีภายนอกที่นำมาผสมถัง:
                        </span>
                        <div className="space-y-1">
                          {round.externalProducts.map((ep, epIdx) => (
                            <div
                              key={epIdx}
                              className="flex items-center justify-between text-xs py-1 px-2.5 bg-indigo-50/50 rounded border border-indigo-100"
                            >
                              <div>
                                <span className="font-semibold text-indigo-900">
                                  {ep.productName}
                                </span>
                                {ep.company && (
                                  <span className="text-[11px] text-slate-500 ml-1.5">
                                    ({ep.company})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-slate-600">
                                <span>สูตร: {ep.formula}</span>
                                <span>• อัตรา: {ep.applicationRate}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Before Spray Photos */}
                  {round.attachments && round.attachments.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                        <Camera className="w-3 h-3 text-emerald-600" />
                        <span>รูปภาพก่อนฉีดพ่น ({round.attachments.length} รูป):</span>
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {round.attachments.map((att, aIdx) => (
                          <div
                            key={aIdx}
                            onClick={() => setPreviewImage(att.fileUrl)}
                            className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-100 cursor-pointer"
                          >
                            <img
                              src={att.fileUrl}
                              alt={att.fileName || `before-spray-${aIdx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Roll-up Summary Card */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-600" />
            <h5 className="font-bold text-xs sm:text-sm text-slate-800">
              สรุปรายการสินค้ารวมทุกแปลง (Computed Roll-up)
            </h5>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            รวม {plots.length} แปลง
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-medium">
                <th className="py-2 px-3 w-12 text-center">ลำดับ</th>
                <th className="py-2 px-3">ชื่อสินค้า/ตัวยา</th>
                <th className="py-2 px-3 text-right">จำนวนรวม</th>
                <th className="py-2 px-3 w-20">หน่วย</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rollUpSummary.map((item, idx) => (
                <tr key={item.productId || idx} className="hover:bg-white/60">
                  <td className="py-2 px-3 text-center text-slate-400 font-medium">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-700">
                    {item.productName}
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-emerald-600">
                    {item.quantity.toLocaleString()}
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

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[85vh] rounded-xl object-contain"
            />
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Type13Detail;
