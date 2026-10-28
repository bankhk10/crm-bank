"use client";

import React, { useState } from "react";
import {
  MapPin,
  Package,
  Calendar,
  Camera,
  Eye,
  X,
  Layers,
  Clock,
  Activity,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  Sprout,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Type14PlotItem, Type14SprayRoundState } from "../../shared/types";
import type {
  Type14DetailData,
  Type14DetailProps,
  Type14DetailViewProps,
} from "../types/actual.types";

export type { Type14DetailProps, Type14DetailViewProps };

export function Type14DetailView({
  isVisible = true,
  plots = [],
  data,
  actualData,
  planSummary,
  className = "",
}: Type14DetailViewProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!isVisible) return null;

  const rawRounds: Type14SprayRoundState[] =
    actualData?.rounds || actualData?.sprayRounds || [];

  const rawActualPlots: any[] =
    actualData?.plots ||
    actualData?.type14Plots ||
    (planSummary as any)?.type14Actual?.plots ||
    [];

  const attachments = actualData?.attachments || [];

  const effectivePlots: any[] =
    plots.length > 0
      ? plots
      : rawActualPlots.length > 0
        ? rawActualPlots
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
                  province: data.province || "",
                  district: data.district || "",
                },
              ]
            : [];

  const plannedWithdrawnProducts: any[] =
    data?.withdrawnProducts ||
    (data as any)?.products ||
    (data as any)?.type14Products ||
    planSummary?.withdrawnProducts ||
    (planSummary as any)?.type14Products ||
    [];

  const hasPlotBasedResults = effectivePlots.some(
    (p, idx) =>
      p.actualPlotsCount != null ||
      p.daysAfterSpray != null ||
      p.trackingResult != null ||
      rawActualPlots[idx] != null,
  );

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 space-y-6 shadow-2xs ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">
              บันทึกผลการติดตามแปลงแฮตแทค (TYPE_14)
            </h4>
            <p className="text-xs text-slate-500">
              ผลการตรวจติดตามแปลง จำนวนแปลงจริง สินค้าที่ใช้ และรูปถ่ายผลงาน
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-semibold px-2.5 py-0.5"
          >
            {effectivePlots.length > 0
              ? `${effectivePlots.length} แปลง`
              : rawRounds.length > 0
                ? `${rawRounds.length} รอบ`
                : "ไม่มีแปลง"}
          </Badge>
        </div>
      </div>

      {/* 1.1 สินค้าที่เบิกตามแผนส่วนกลาง (Planned Demo Products) */}
      {plannedWithdrawnProducts.length > 0 && (
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/30 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-emerald-600" />
              <h5 className="font-bold text-xs sm:text-sm text-emerald-950">
                1. สินค้าที่เบิกตามแผน (Planned Demo Products)
              </h5>
            </div>
            <Badge
              variant="outline"
              className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[11px] font-semibold px-2 py-0.5"
            >
              {plannedWithdrawnProducts.length} รายการ
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
            {plannedWithdrawnProducts.map((prod, pIdx) => (
              <div
                key={prod.id || pIdx}
                className="flex items-center justify-between rounded-lg bg-white p-2.5 border border-emerald-200 shadow-2xs"
              >
                <span className="font-semibold text-slate-800 truncate mr-2">
                  {prod.productName ||
                    prod.product?.name ||
                    `สินค้า #${pIdx + 1}`}
                </span>
                <span className="font-bold text-emerald-700 shrink-0 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  {prod.quantity || prod.withdrawnQuantity || 1}{" "}
                  {prod.unit || prod.product?.unit || "ขวด"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plots Stacked Breakdown (Plot-based matching TYPE_13) */}
      {effectivePlots.length > 0 ? (
        <div className="space-y-6">
          {effectivePlots.map((plot: any, plotIdx: number) => {
            const actualPlotData =
              rawActualPlots.find(
                (ap: any) =>
                  (plot.id && (ap.id === plot.id || ap.targetId === plot.id)) ||
                  (plot.type13TargetId &&
                    (ap.type13TargetId === plot.type13TargetId ||
                      ap.targetId === plot.type13TargetId)),
              ) ||
              rawActualPlots[plotIdx] ||
              plot;

            const dealerDisplayName =
              plot.dealerName ||
              actualPlotData.dealerName ||
              plot.store?.name ||
              "-";

            const locParts = [
              plot.subdistrict
                ? `ต.${plot.subdistrict}`
                : actualPlotData.subdistrict
                  ? `ต.${actualPlotData.subdistrict}`
                  : null,
              plot.district
                ? `อ.${plot.district}`
                : actualPlotData.district
                  ? `อ.${actualPlotData.district}`
                  : null,
              plot.province
                ? `จ.${plot.province}`
                : actualPlotData.province
                  ? `จ.${actualPlotData.province}`
                  : null,
            ].filter(Boolean);
            const locationText = locParts.length > 0 ? locParts.join(" ") : null;

            const ownerDisplayName =
              plot.ownerName || actualPlotData.ownerName || "-";
            const villageDisplayName =
              plot.village || actualPlotData.village || "-";

            const plannedCount =
              plot.plannedPlotsCount != null && plot.plannedPlotsCount !== ""
                ? plot.plannedPlotsCount
                : 1;

            const actualCount =
              actualPlotData.actualPlotsCount != null &&
              actualPlotData.actualPlotsCount !== ""
                ? actualPlotData.actualPlotsCount
                : plot.actualPlotsCount != null
                  ? plot.actualPlotsCount
                  : plannedCount;

            const effectivePlotProducts: any[] =
              actualPlotData.products && actualPlotData.products.length > 0
                ? actualPlotData.products
                : plot.products && plot.products.length > 0
                  ? plot.products
                  : plannedWithdrawnProducts;

            const plotImages =
              actualPlotData.afterSprayImages &&
              actualPlotData.afterSprayImages.length > 0
                ? actualPlotData.afterSprayImages
                : attachments.filter((att: any) => {
                    if (att.targetId && plot.id && att.targetId === plot.id) {
                      return true;
                    }
                    if (
                      att.type14ResultId &&
                      actualPlotData.resultId &&
                      att.type14ResultId === actualPlotData.resultId
                    ) {
                      return true;
                    }
                    if (effectivePlots.length === 1) return true;
                    return false;
                  });

            return (
              <div
                key={plot.id || plotIdx}
                className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-4 sm:p-5 space-y-4 shadow-2xs"
              >
                {/* Plot Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {plotIdx + 1}
                    </div>
                    <span className="font-bold text-slate-800 text-sm sm:text-base">
                      แปลงที่ {plotIdx + 1}:{" "}
                      {plot.plotName || plot.name || `แปลงแฮตแทค ${plotIdx + 1}`}
                    </span>
                    {dealerDisplayName !== "-" && (
                      <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                        (ตัวแทน: {dealerDisplayName})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-semibold"
                    >
                      ติดตามจริง: {actualCount} แปลง
                    </Badge>
                    {actualPlotData.plotStatus === "COMPLETED" ||
                    plot.plotStatus === "COMPLETED" ||
                    (plot as any).type13Target?.status === "COMPLETED" ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-xs">
                        ปิดแปลงแล้ว
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-bold text-xs">
                        ต้องติดตามต่อ
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Display Grid: Dealer, Owner, Village, Counts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="block text-[11px] text-slate-400 font-medium">
                      ร้านค้า Dealer
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 block mt-0.5 truncate">
                      {dealerDisplayName}
                    </span>
                    {locationText && (
                      <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
                        {locationText}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="block text-[11px] text-slate-400 font-medium">
                      เจ้าของแปลง / เกษตรกร
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 block mt-0.5 truncate">
                      {ownerDisplayName}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[11px] text-slate-400 font-medium">
                      หมู่บ้าน
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 block mt-0.5 truncate">
                      {villageDisplayName}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[11px] text-slate-400 font-medium">
                      จำนวนแปลงตามแผน vs ผลงานจริง
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-emerald-800 block mt-0.5">
                      ตามแผน: {plannedCount} | ผลจริง: {actualCount} แปลง
                    </span>
                  </div>
                </div>

                {/* 1.1 สินค้าที่เบิกตามแผน (Planned Demo Products) for this plot */}
                {effectivePlotProducts.length > 0 && (
                  <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-emerald-600" />
                        <h5 className="font-bold text-xs sm:text-sm text-slate-800">
                          1.1 สินค้าที่เบิกตามแผนและผลการใช้
                        </h5>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-semibold px-2 py-0.5"
                      >
                        {effectivePlotProducts.length} รายการ
                      </Badge>
                    </div>

                    <div className="space-y-2.5">
                      {effectivePlotProducts.map((p: any, pIdx: number) => {
                        const extraStr =
                          p.extraQuantity != null &&
                          String(p.extraQuantity).trim() !== ""
                            ? ` (+${p.extraQuantity} ${p.extraUnit || "ซีซี"})`
                            : "";

                        return (
                          <div
                            key={p.productId || pIdx}
                            className="bg-emerald-50/40 border border-emerald-200/70 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                          >
                            <span className="font-bold text-slate-900">
                              {pIdx + 1}. {p.productName || "สินค้าตัวอย่าง"}
                            </span>
                            <div className="flex flex-wrap items-center gap-3 text-slate-600">
                              {p.withdrawnQuantity != null && (
                                <span className="text-slate-500">
                                  เบิก: {p.withdrawnQuantity} {p.unit || "ขวด"}
                                </span>
                              )}
                              <span className="font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
                                ใช้จริง: {p.actualQuantity ?? p.quantityUsed ?? 1}{" "}
                                {p.unit || "ขวด"}
                                {extraStr}
                              </span>
                              {p.actualRate && (
                                <span className="text-slate-600 bg-white border border-emerald-200 px-2 py-0.5 rounded">
                                  อัตรา: {p.actualRate}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 1.2 ผลการตรวจติดตามแปลง */}
                <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <h5 className="font-bold text-xs sm:text-sm text-slate-800">
                      1.2 ผลการตรวจติดตามแปลง
                    </h5>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                      <span className="text-slate-400 block mb-0.5">
                        ระยะเวลาหลังฉีดพ่น:
                      </span>
                      <span className="font-semibold text-slate-800">
                        {actualPlotData.daysAfterSpray != null &&
                        String(actualPlotData.daysAfterSpray).trim() !== ""
                          ? `${actualPlotData.daysAfterSpray} วัน`
                          : "-"}
                      </span>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                      <span className="text-slate-400 block mb-0.5">
                        ผลการติดตามแปลง:
                      </span>
                      <span className="font-semibold text-emerald-800">
                        {actualPlotData.trackingResult || "ได้ผลตามเกณฑ์"}
                      </span>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                      <span className="text-slate-400 block mb-0.5">
                        การตอบสนองของพืช:
                      </span>
                      <span className="font-semibold text-slate-800">
                        {actualPlotData.productResponse || "ปกติ"}
                      </span>
                    </div>
                  </div>

                  {actualPlotData.additionalNotes && (
                    <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100 text-xs">
                      <span className="text-slate-400 block mb-0.5">
                        บันทึกข้อสังเกตเพิ่มเติม / ปัญหาที่พบ:
                      </span>
                      <span className="font-medium text-slate-800">
                        {actualPlotData.additionalNotes}
                      </span>
                    </div>
                  )}

                  {(actualPlotData.closureNotes ||
                    (plot as any).closureNotes ||
                    (plot as any).type13Target?.closureNotes) && (
                    <div className="rounded-lg bg-emerald-50/80 p-2.5 border border-emerald-200 text-xs space-y-0.5">
                      <span className="text-emerald-900 font-semibold block">
                        สรุปผลการปิดแปลง / ความพึงพอใจ:
                      </span>
                      <span className="font-medium text-emerald-800 italic">
                        "{actualPlotData.closureNotes ||
                          (plot as any).closureNotes ||
                          (plot as any).type13Target?.closureNotes}"
                      </span>
                    </div>
                  )}
                </div>

                {/* 1.3 รูปถ่ายหลังติดตามแปลง */}
                {plotImages && plotImages.length > 0 && (
                  <div className="space-y-2 pt-1 border-t border-slate-200/60">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-emerald-600" />
                      รูปถ่ายหลังติดตามแปลง ({plotImages.length} รูป)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {plotImages.map((img: any, imgIdx: number) => {
                        const imgUrl = img.url || img.fileUrl;
                        return (
                          <div
                            key={img.id || imgIdx}
                            className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-2xs hover:shadow-xs"
                            onClick={() => setPreviewImage(imgUrl)}
                          >
                            <img
                              src={imgUrl}
                              alt={img.name || img.fileName || `img-${imgIdx + 1}`}
                              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="w-4 h-4 text-white drop-shadow-md" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : rawRounds.length > 0 ? (
        /* Legacy fallback for round-based records */
        <div className="space-y-4">
          {rawRounds.map((round, idx) => (
            <div
              key={round.id || idx}
              className="rounded-xl border border-slate-200 p-4 space-y-3 bg-white"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                    {round.roundNumber || idx + 1}
                  </span>
                  <span className="font-semibold text-sm text-slate-800">
                    รอบที่ {round.roundNumber || idx + 1}
                  </span>
                  {round.actualVisitDate && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(round.actualVisitDate).toLocaleDateString(
                        "th-TH",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {round.daysAfterSpray && (
                    <Badge
                      variant="outline"
                      className="bg-slate-50 text-slate-700 border-slate-200 text-xs"
                    >
                      <Clock className="w-3 h-3 mr-1 text-slate-400" />
                      หลังฉีด {round.daysAfterSpray} วัน
                    </Badge>
                  )}
                  {round.trackingResult && (
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-semibold"
                    >
                      {round.trackingResult}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Response & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {round.productResponse && (
                  <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">
                      การตอบสนองของพืช:
                    </span>
                    <span className="font-medium text-slate-800">
                      {round.productResponse}
                    </span>
                  </div>
                )}
                {round.additionalNotes && (
                  <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">
                      บันทึกเพิ่มเติม:
                    </span>
                    <span className="font-medium text-slate-800">
                      {round.additionalNotes}
                    </span>
                  </div>
                )}
              </div>

              {/* Photos */}
              {round.afterSprayImages && round.afterSprayImages.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-emerald-600" />
                    รูปถ่ายการติดตาม ({round.afterSprayImages.length} รูป)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {round.afterSprayImages.map((img, imgIdx) => (
                      <div
                        key={img.id || imgIdx}
                        className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-2xs hover:shadow-xs"
                        onClick={() => setPreviewImage(img.url)}
                      >
                        <img
                          src={img.url}
                          alt={img.name || `tracking-img-${imgIdx + 1}`}
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
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed">
          ยังไม่มีการบันทึกผลการติดตามแปลง
        </div>
      )}

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

export const Type14Detail = Type14DetailView;
