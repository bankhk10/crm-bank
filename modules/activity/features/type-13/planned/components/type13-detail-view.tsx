"use client";

import React, { useState } from "react";
import {
  MapPin,
  Package,
  Beaker,
  Calendar,
  ExternalLink,
  Camera,
  Eye,
  X,
} from "lucide-react";
import type { Type13PlotItem } from "../../shared/types";
import type {
  Type13DetailData,
  Type13DetailProps,
  Type13DetailViewProps,
  DetailType13AttackProps,
} from "../types/actual.types";

export type {
  DetailType13AttackProps,
  Type13DetailProps,
  Type13DetailViewProps,
};

export function Type13DetailView({
  isVisible = true,
  plots = [],
  actualData,
  planSummary,
}: Type13DetailViewProps) {
  const [activePlotIdx, setActivePlotIdx] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!isVisible) return null;

  const sprayRoundsList = actualData?.sprayRounds || [];
  const hasAnySprayData =
    sprayRoundsList.length > 0 ||
    (actualData?.type13PlotsActual &&
      actualData.type13PlotsActual.length > 0) ||
    (actualData?.attachments && actualData.attachments.length > 0);

  if (!hasAnySprayData && (!plots || plots.length === 0)) {
    return null;
  }

  const effectivePlots =
    plots.length > 0
      ? plots
      : [
          {
            id: "plot-1",
            name: "แปลงที่ 1",
            storeId: "",
            ownerName: "",
            province: "",
            district: "",
            products: [],
          },
        ];

  const currentPlot = effectivePlots[activePlotIdx] || effectivePlots[0];

  // Coordinates for current plot
  const plotCoord =
    actualData?.type13PlotsActual?.find(
      (c) =>
        c.demoPlotId === currentPlot.id ||
        (currentPlot.demoPlotId && c.demoPlotId === currentPlot.demoPlotId),
    ) ||
    (currentPlot.latitude && currentPlot.longitude
      ? { latitude: currentPlot.latitude, longitude: currentPlot.longitude }
      : null);

  // Spray rounds for current plot
  const plotRounds = sprayRoundsList.filter(
    (r) =>
      !r.demoPlotId ||
      effectivePlots.length <= 1 ||
      (r as any).targetId === currentPlot.id || r.demoPlotId === currentPlot.id || ((r as any).result && (r as any).result.targetId === currentPlot.id) ||
      (currentPlot.demoPlotId && r.demoPlotId === currentPlot.demoPlotId),
  );

  // After-spray attachments for current plot
  const afterSprayAttachments = (actualData?.attachments || []).filter(
    (att) =>
      !att.sprayRoundId &&
      (!att.demoPlotId ||
        effectivePlots.length <= 1 ||
        (att as any).targetId === currentPlot.id || att.demoPlotId === currentPlot.id || ((att as any).type13ResultId && currentPlot.result && (att as any).type13ResultId === currentPlot.result.id) ||
        (currentPlot.demoPlotId && att.demoPlotId === currentPlot.demoPlotId)),
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 space-y-5 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
            13
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <span>ผลการฉีดแปลงแฮตแทค (TYPE_13)</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                ทั้งหมด {effectivePlots.length} แปลง
              </span>
            </h4>
            <p className="text-xs text-slate-500">
              พิกัดแปลง, ประวัติการฉีดพ่นสารเคมี และรูปถ่ายผลการปฏิบัติงานจริง
            </p>
          </div>
        </div>
      </div>

      {/* Plot Tabs (if multiple) */}
      {effectivePlots.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {effectivePlots.map((plot, pIdx) => {
            const isActive = pIdx === activePlotIdx;
            return (
              <button
                key={plot.id || pIdx}
                type="button"
                onClick={() => setActivePlotIdx(pIdx)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                  isActive
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span>{plot.name || `แปลงที่ ${pIdx + 1}`}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Current Plot Actual Card */}
      <div className="bg-slate-50/60 rounded-2xl border border-slate-200/80 p-4 sm:p-5 space-y-4">
        {/* Info & GPS Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200">
          <div>
            <span className="block text-[11px] text-slate-400 font-medium">
              ชื่อแปลง
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-800">
              {currentPlot.name || `แปลงที่ ${activePlotIdx + 1}`}
            </span>
          </div>

          <div>
            <span className="block text-[11px] text-slate-400 font-medium">
              ร้านค้า Dealer
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-700">
              {currentPlot.dealerName || currentPlot.ownerName || currentPlot.storeId || "-"}
            </span>
            <span className="block text-[11px] text-slate-400 mt-0.5">
              {[
                currentPlot.subdistrict ? `ต.${currentPlot.subdistrict}` : null,
                currentPlot.district ? `อ.${currentPlot.district}` : null,
                currentPlot.province ? `จ.${currentPlot.province}` : null,
              ].filter(Boolean).join(" ") || "-"}
              {currentPlot.village ? ` (ม.${currentPlot.village})` : ""}
            </span>
          </div>

          {(currentPlot.plannedPlotsCount != null || (plotCoord as any)?.actualPlotsCount != null) && (
            <div>
              <span className="block text-[11px] text-slate-400 font-medium">
                จำนวนแปลง (แผน / จริง)
              </span>
              <span className="text-xs sm:text-sm font-semibold text-emerald-800">
                {currentPlot.plannedPlotsCount != null ? `แผน: ${currentPlot.plannedPlotsCount} แปลง` : ""}
                {(plotCoord as any)?.actualPlotsCount != null && (
                  <span className="text-emerald-700 ml-1.5 font-bold">
                    ฉีดจริง: {(plotCoord as any).actualPlotsCount} แปลง
                  </span>
                )}
              </span>
            </div>
          )}

          {plotCoord && (
            <div className="sm:col-span-2 md:col-span-1">
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>ที่ตั้งแปลง</span>
              </span>
              <span className="text-xs font-mono font-bold text-slate-800 block">
                {String(plotCoord.latitude)}, {String(plotCoord.longitude)}
              </span>
              <a
                href={`https://maps.google.com/?q=${plotCoord.latitude},${plotCoord.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1 underline mt-0.5"
              >
                <span>เปิดดูในแผนที่</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Actual Spraying Rounds */}
        {plotRounds.length > 0 ? (
          <div className="space-y-4 pt-1">
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
                        {round.sprayMethod === "TANK_MIXED" ? "ผสมถัง" : "เดี่ยว"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {round.sprayDate
                          ? new Date(round.sprayDate).toLocaleDateString("th-TH")
                          : "-"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
                    <div>
                      <span className="text-slate-400">อุปกรณ์: </span>
                      <span className="font-semibold text-slate-700">
                        {round.sprayEquipment || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">ผลหลังฉีด: </span>
                      <span className="font-semibold text-slate-700">
                        {round.productResponse || "-"}
                      </span>
                    </div>
                  </div>

                  {/* Products */}
                  {round.products && round.products.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">
                        ผลิตภัณฑ์ที่ใช้:
                      </span>
                      <div className="space-y-1">
                        {round.products.map((p, pIdx) => (
                          <div
                            key={pIdx}
                            className="flex items-center justify-between text-xs bg-slate-50 px-2.5 py-1.5 rounded-lg"
                          >
                            <span className="font-medium text-slate-800">
                              {p.productName || p.productId}
                            </span>
                            <span className="text-slate-600 font-semibold">
                              {p.actualRate ? `อัตรา ${p.actualRate}` : ""}{" "}
                              {p.quantityUsed != null ? `(ใช้ ${p.quantityUsed} ${p.unit || "ขวด"})` : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-white rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
            ยังไม่มีบันทึกรอบการฉีดพ่น
          </div>
        )}

        {/* After-Spray Photos */}
        {afterSprayAttachments.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-600" />
              <h6 className="font-bold text-xs sm:text-sm text-slate-800">
                รูปถ่ายหลังฉีดพ่น ({afterSprayAttachments.length} รูป)
              </h6>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {afterSprayAttachments.map((att, attIdx) => (
                <div
                  key={attIdx}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-2xs hover:shadow-xs"
                  onClick={() => setPreviewImage(att.fileUrl)}
                >
                  <img
                    src={att.fileUrl}
                    alt={att.fileName || `after-spray-${attIdx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Eye className="w-4 h-4 text-white drop-shadow-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Full size preview"
              className="w-full h-auto max-h-[85vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export { Type13DetailView as DetailType13Attack, Type13DetailView as Type13Detail };
