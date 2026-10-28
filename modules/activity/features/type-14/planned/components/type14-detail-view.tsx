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

  const attachments = actualData?.attachments || [];

  const effectivePlots: Type14PlotItem[] =
    plots.length > 0
      ? plots
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

  const primaryPlot = effectivePlots[0];

  const plannedWithdrawnProducts: any[] =
    data?.withdrawnProducts ||
    (data as any)?.products ||
    (data as any)?.type14Products ||
    planSummary?.withdrawnProducts ||
    (planSummary as any)?.type14Products ||
    [];

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 space-y-5 shadow-2xs ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">
              บันทึกผลการติดตามแปลงแฮตแทค (Type 14)
            </h4>
            <p className="text-xs text-slate-500">
              ผลการตรวจแปลง ระยะเวลาหลังฉีดพ่น และการตอบสนองของพืช
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-semibold px-2.5 py-0.5"
          >
            {rawRounds.length > 0
              ? `บันทึกแล้ว ${rawRounds.length} รอบ`
              : "ยังไม่มีบันทึกรอบติดตาม"}
          </Badge>
        </div>
      </div>

      {/* Plot info header if present */}
      {primaryPlot && (
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-slate-900 text-sm">
              แปลงเป้าหมาย:{" "}
              {primaryPlot.name || primaryPlot.plotName || "แปลงแฮตแทค"}
            </span>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {[primaryPlot.district, primaryPlot.province]
                  .filter(Boolean)
                  .join(", ") ||
                  [planSummary?.district, planSummary?.province]
                    .filter(Boolean)
                    .join(", ") ||
                  "-"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            {primaryPlot.dealerName && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200">
                <span className="text-slate-400">ร้านค้า:</span>
                <span className="font-semibold text-slate-800">
                  {primaryPlot.dealerName}
                </span>
              </span>
            )}
            {primaryPlot.ownerName && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200">
                <span className="text-slate-400">เกษตรกร:</span>
                <span className="font-semibold text-slate-800">
                  {primaryPlot.ownerName}
                </span>
              </span>
            )}
            {primaryPlot.cropName && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800">
                พืช: {primaryPlot.cropName}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 1.1 สินค้าที่เบิกตามแผน (Planned Demo Products) */}
      {plannedWithdrawnProducts.length > 0 && (
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/30 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-emerald-600" />
              <h5 className="font-bold text-xs sm:text-sm text-emerald-950">
                1.1 สินค้าที่เบิกตามแผน (Planned Demo Products)
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

      {/* Tracking rounds breakdown */}
      {rawRounds.length > 0 ? (
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

              {/* Products in this round */}
              {round.products && round.products.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-emerald-600" />
                    สินค้าที่บันทึก ({round.products.length} รายการ)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {round.products.map((p, pIdx) => (
                      <div
                        key={pIdx}
                        className="rounded-lg border border-slate-200 bg-slate-50/50 p-2 flex items-center justify-between"
                      >
                        <span className="font-medium text-slate-800">
                          {p.productName || `สินค้า #${pIdx + 1}`}
                        </span>
                        <div className="flex items-center gap-2">
                          {p.actualRate && (
                            <span className="text-slate-500">
                              อัตรา: {p.actualRate}
                            </span>
                          )}
                          {p.quantityUsed != null && (
                            <span className="font-semibold text-emerald-700">
                              {p.quantityUsed} {p.unit || "ขวด"}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Images in this round */}
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

      {/* Loose attachments if present */}
      {attachments.length > 0 &&
        rawRounds.every(
          (r) => !r.afterSprayImages || r.afterSprayImages.length === 0,
        ) && (
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-600" />
              <h6 className="font-bold text-xs sm:text-sm text-slate-800">
                รูปถ่ายแนบ ({attachments.length} รูป)
              </h6>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {attachments.map((att: any, attIdx: number) => (
                <div
                  key={attIdx}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-2xs hover:shadow-xs"
                  onClick={() => setPreviewImage(att.fileUrl || att.url)}
                >
                  <img
                    src={att.fileUrl || att.url}
                    alt={att.fileName || `att-${attIdx + 1}`}
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
