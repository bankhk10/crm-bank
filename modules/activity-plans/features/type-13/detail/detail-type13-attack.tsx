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
  Crosshair,
} from "lucide-react";
import type { Type13PlotItem } from "../shared/types";
import type { Type13DetailData } from "./types";

export interface DetailType13AttackProps {
  isVisible?: boolean;
  plots?: Type13PlotItem[];
  actualData?: Type13DetailData;
  planSummary?: {
    province?: string | null;
    district?: string | null;
  };
}

export function DetailType13Attack({
  isVisible = true,
  plots = [],
  actualData,
  planSummary,
}: DetailType13AttackProps) {
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
            hasDrugWithdrawal: false,
            withdrawalItems: [],
          },
        ];

  const currentPlot = effectivePlots[activePlotIdx] || effectivePlots[0];

  // Coordinates for current plot
  const plotCoord = actualData?.type13PlotsActual?.find(
    (c) => c.demoPlotId === currentPlot.id,
  );

  // Spray rounds for current plot
  const plotRounds = sprayRoundsList.filter(
    (r) => r.demoPlotId === currentPlot.id,
  );

  // After-spray attachments for current plot
  const afterSprayAttachments = (actualData?.attachments || []).filter(
    (att) => att.demoPlotId === currentPlot.id && !att.sprayRoundId,
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 space-y-5 shadow-xs">
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
            {(currentPlot.district || currentPlot.province) && (
              <span className="block text-[11px] text-slate-400 mt-0.5">
                {[currentPlot.district, currentPlot.province].filter(Boolean).join(" / ")}
              </span>
            )}
          </div>

          {plotCoord && (
            <div>
              <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>ที่ตั้งแปลง</span>
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
                        {round.sprayMethod === "TANK_MIXED"
                          ? "ผสมถัง"
                          : "ฉีดเดี่ยว"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {round.sprayDate
                          ? new Date(round.sprayDate).toLocaleDateString(
                              "th-TH",
                            )
                          : "-"}
                      </span>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">
                        อุปกรณ์
                      </span>
                      <span className="font-medium text-slate-700">
                        {round.sprayEquipment}
                        {round.otherEquipment
                          ? ` (${round.otherEquipment})`
                          : ""}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">
                        ผลหลังฉีด
                      </span>
                      <span className="font-semibold text-emerald-600">
                        {round.productResponse}
                      </span>
                    </div>
                    {round.problemDetail && (
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-slate-400 block text-[11px]">
                          ปัญหาที่พบ
                        </span>
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
                      {round.products.map((p, pIdx) => {
                        const isWithdrawn = Boolean(
                          p.drugWithdrawalItemId || p.drugWithdrawalItem,
                        );
                        const withdrawnQty =
                          p.drugWithdrawalItem?.quantity != null
                            ? Number(p.drugWithdrawalItem.quantity)
                            : null;

                        return (
                          <div
                            key={pIdx}
                            className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1 text-xs"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-slate-800">
                                  {p.productName || "สินค้าไม่ระบุชื่อ"}
                                </span>
                                {isWithdrawn ? (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                    จากรายการเบิก
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                                    เพิ่มเติม / ไม่ได้เบิก
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-slate-600">
                                {isWithdrawn && withdrawnQty != null && (
                                  <span className="text-[11px] text-slate-500">
                                    เบิก:{" "}
                                    <strong className="text-emerald-700">
                                      {withdrawnQty}
                                    </strong>{" "}
                                    {p.unit || ""}
                                  </span>
                                )}
                                <span className="text-slate-500">
                                  อัตรา: {p.actualRate || "-"}
                                </span>
                                <span className="font-bold text-emerald-600">
                                  ใช้จริง:{" "}
                                  {Number(p.quantityUsed).toLocaleString()}{" "}
                                  {p.unit || "หน่วย"}
                                </span>
                              </div>
                            </div>
                            {p.detail && (
                              <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                                <span className="text-slate-400 font-medium">
                                  รายละเอียด:{" "}
                                </span>
                                <span>{p.detail}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
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
                        <span>
                          รูปภาพก่อนฉีดพ่น ({round.attachments.length} รูป):
                        </span>
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
        ) : (
          <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-400 text-center italic">
            ยังไม่มีการบันทึกผลการฉีดพ่นสำหรับแปลงนี้
          </div>
        )}

        {/* After Spray Photos */}
        {afterSprayAttachments.length > 0 && (
          <div className="bg-slate-50/70 rounded-xl border border-slate-200/80 p-4 space-y-3">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-emerald-600" />
              <span>รูปหลังฉีดพ่น ({afterSprayAttachments.length} รูป)</span>
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {afterSprayAttachments.map((att, aIdx) => (
                <div
                  key={aIdx}
                  onClick={() => setPreviewImage(att.fileUrl)}
                  className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 cursor-pointer shadow-2xs"
                >
                  <img
                    src={att.fileUrl}
                    alt={att.fileName || `after-spray-${aIdx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Eye className="w-4 h-4 text-white" />
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1.5 py-0.5 text-[10px] text-white truncate pointer-events-none">
                    รูป {aIdx + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
