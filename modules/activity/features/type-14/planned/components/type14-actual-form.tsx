"use client";

import React from "react";
import {
  Calendar,
  Clock,
  Layers,
  Plus,
  Trash2,
  FileText,
  AlertCircle,
  Package,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ActivityInput,
  ActivityProductSelect,
  ActivityPhotoUpload,
  type ImageFile,
} from "@/modules/activity/ui";
import {
  TRACKING_RESULT_OPTIONS,
  PRODUCT_RESPONSE_OPTIONS,
  TYPE14_MAX_IMAGES_PER_VILLAGE,
} from "../../shared/constants";
import type {
  Type14SprayRoundState,
  Type14ActualProductState,
  Type14PlotActualState,
  ProductOption,
} from "../../shared/types";
import type { Type14ActualProps } from "../types/actual.types";

export type { Type14ActualProps };

export function Type14ActualForm({
  isVisible = true,
  actualState,
  products = [],
  dealers = [],
  readonly = false,
  className = "",
  targets = [],
}: Type14ActualProps) {
  if (!isVisible || !actualState) return null;

  const rounds: Type14SprayRoundState[] = actualState.rounds || [];
  const plotsActual: Type14PlotActualState[] = actualState.plotsActual || [];
  const updatePlotField = actualState.updatePlotField;

  const fallbackPlots: Type14PlotActualState[] = React.useMemo(() => {
    return targets.map((t, idx) => ({
      id: t.id,
      demoPlotId: t.demoPlotId || t.type13TargetId || t.id,
      type13TargetId: t.type13TargetId || t.demoPlotId || t.id,
      clientPlotId: `plot-${idx}`,
      name: t.plotName || t.name || `แปลงที่ ${idx + 1}`,
      plotName: t.plotName || t.name || `แปลงที่ ${idx + 1}`,
      storeId: t.storeId || "",
      dealerName: t.dealerName || null,
      ownerName: t.ownerName || null,
      province: t.province || "",
      district: t.district || "",
      subdistrict: t.subdistrict || null,
      village: t.village || null,
      plannedPlotsCount: t.plannedPlotsCount ?? 1,
      actualPlotsCount: t.actualPlotsCount ?? t.plannedPlotsCount ?? 1,
    }));
  }, [targets]);

  const plotsList = plotsActual.length > 0 ? plotsActual : fallbackPlots;

  // Auto-sync fallback plots into actualState if initially empty
  React.useEffect(() => {
    if (
      plotsActual.length === 0 &&
      fallbackPlots.length > 0 &&
      actualState.setPlotsActual
    ) {
      actualState.setPlotsActual(fallbackPlots);
    }
  }, [plotsActual.length, fallbackPlots, actualState.setPlotsActual]);

  const handleUpdatePlotActualCount = (plotIdx: number, val: any) => {
    if (readonly) return;
    if (updatePlotField) {
      updatePlotField(plotIdx, "actualPlotsCount", val);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Plots Stacked List & Actual Plots Count Input (เหมือน Type 13) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 space-y-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 font-bold shrink-0">
              14
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                <span>บันทึกผลงานจริง: ติดตามแปลงแฮตแทค (TYPE_14)</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                  {plotsList.length} แปลง
                </span>
              </h4>
              <p className="text-xs text-slate-500">
                ระบุจำนวนแปลงที่ติดตามผลจริงสำหรับแต่ละแปลง พร้อมบันทึกรายละเอียดรอบการติดตาม
              </p>
            </div>
          </div>
        </div>

        {/* Plots Stacked List */}
        <div className="space-y-4">
          {plotsList.map((plot: Type14PlotActualState, plotIdx: number) => {
            const matchedDealer = dealers?.find(
              (d: any) => d.id === plot.storeId,
            );
            const dealerDisplayName =
              plot.dealerName ||
              matchedDealer?.name ||
              "-";

            const locParts = [
              plot.subdistrict ? `ต.${plot.subdistrict}` : null,
              plot.district ? `อ.${plot.district}` : null,
              plot.province ? `จ.${plot.province}` : null,
            ].filter(Boolean);
            const locationText = locParts.length > 0 ? locParts.join(" ") : null;

            const ownerDisplayName = plot.ownerName || "-";
            const villageDisplayName = plot.village || "-";
            const plannedCount =
              plot.plannedPlotsCount != null && plot.plannedPlotsCount !== ""
                ? plot.plannedPlotsCount
                : 1;

            return (
              <div
                key={plot.clientPlotId || plot.id || `plot-${plotIdx}`}
                className="bg-slate-50/60 rounded-2xl border border-slate-200/80 p-4 sm:p-5 space-y-4 shadow-2xs hover:border-emerald-200 transition-colors"
              >
                {/* Header: Plot Index & Plot Name */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {plotIdx + 1}
                    </div>
                    <span className="font-bold text-slate-800 text-sm">
                      แปลงที่ {plotIdx + 1}: {plot.plotName || plot.name || `แปลงแฮตแทค ${plotIdx + 1}`}
                    </span>
                    {dealerDisplayName !== "-" && (
                      <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                        (ตัวแทน: {dealerDisplayName})
                      </span>
                    )}
                  </div>
                </div>

                {/* Display Section: Dealer, Owner, Village, Planned plots */}
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
                      จำนวนแปลงตามแผน
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-emerald-800 block mt-0.5">
                      {plannedCount} แปลง
                    </span>
                  </div>
                </div>

                {/* Input: จำนวนแปลงที่ติดตามจริง (เหมือน Type 13) */}
                <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200">
                  <div className="max-w-xs space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      จำนวนแปลงที่ติดตามจริง (แปลง){" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <ActivityInput
                      type="number"
                      min={1}
                      placeholder={
                        plannedCount
                          ? `ตามแผน: ${plannedCount} แปลง`
                          : "ระบุจำนวนแปลงที่ติดตามจริง..."
                      }
                      value={
                        plot.actualPlotsCount != null
                          ? String(plot.actualPlotsCount)
                          : ""
                      }
                      onChange={(e) =>
                        handleUpdatePlotActualCount(
                          plotIdx,
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                      disabled={readonly}
                      required
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tracking Rounds */}
      <div className="space-y-5">
        {rounds.map((round, roundIdx) => (
          <div
            key={round.id || roundIdx}
            className="rounded-xl border border-border/80 bg-card p-5 shadow-sm space-y-4"
          >
            {/* Round Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs dark:bg-emerald-950 dark:text-emerald-300">
                  {round.roundNumber || roundIdx + 1}
                </span>
                <h4 className="font-semibold text-foreground text-sm sm:text-base">
                  รอบการติดตามที่ {round.roundNumber || roundIdx + 1}
                </h4>
              </div>

              {!readonly && rounds.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => actualState.removeRound(roundIdx)}
                  className="text-xs text-destructive hover:bg-destructive/10 h-8"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  ลบรอบนี้
                </Button>
              )}
            </div>

            {/* Visit Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  วันที่ติดตามผล <span className="text-destructive">*</span>
                </label>
                <ActivityInput
                  type="date"
                  value={round.actualVisitDate || ""}
                  onChange={(e) =>
                    actualState.updateRoundField(
                      roundIdx,
                      "actualVisitDate",
                      e.target.value,
                    )
                  }
                  disabled={readonly}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  ระยะเวลาหลังฉีดพ่น (วัน)
                </label>
                <ActivityInput
                  type="number"
                  min="0"
                  value={round.daysAfterSpray || ""}
                  onChange={(e) =>
                    actualState.updateRoundField(
                      roundIdx,
                      "daysAfterSpray",
                      e.target.value,
                    )
                  }
                  placeholder="เช่น 7, 14, 21"
                  disabled={readonly}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  ผลการติดตามแปลง <span className="text-destructive">*</span>
                </label>
                <select
                  value={round.trackingResult || "ได้ผลตามเกณฑ์"}
                  onChange={(e) =>
                    actualState.updateRoundField(
                      roundIdx,
                      "trackingResult",
                      e.target.value,
                    )
                  }
                  disabled={readonly}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {TRACKING_RESULT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  การตอบสนองของพืช
                </label>
                <select
                  value={round.productResponse || "ปกติ"}
                  onChange={(e) =>
                    actualState.updateRoundField(
                      roundIdx,
                      "productResponse",
                      e.target.value,
                    )
                  }
                  disabled={readonly}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {PRODUCT_RESPONSE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Additional notes */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                บันทึกข้อสังเกตเพิ่มเติม / ปัญหาที่พบ
              </label>
              <ActivityInput
                value={round.additionalNotes || ""}
                onChange={(e) =>
                  actualState.updateRoundField(
                    roundIdx,
                    "additionalNotes",
                    e.target.value,
                  )
                }
                placeholder="ระบุข้อสังเกต สภาพพืช อาการ หรือแนวทางแก้ไข"
                disabled={readonly}
              />
            </div>

            {/* Observed/Applied Products in this round */}
            <div className="space-y-2 rounded-lg border border-border/70 bg-muted/10 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-emerald-600" />
                  รายการสินค้าที่ตรวจติดตาม / ฉีดพ่นซ้ำ ({round.products?.length || 0})
                </span>
                {!readonly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      actualState.addRoundProduct(roundIdx, {
                        productId: "",
                        productName: "",
                        unit: "ขวด",
                        quantityUsed: 1,
                        actualRate: "",
                        detail: "",
                      })
                    }
                    className="h-7 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    เพิ่มสินค้า
                  </Button>
                )}
              </div>

              {round.products && round.products.length > 0 ? (
                <div className="space-y-2 pt-1">
                  {round.products.map((p, pIdx) => (
                    <div
                      key={pIdx}
                      className="grid grid-cols-12 gap-2 items-center bg-card p-2.5 rounded-lg border"
                    >
                      <div className="col-span-12 sm:col-span-4">
                        <ActivityProductSelect
                          products={products as any}
                          value={p.productId}
                          onChange={(val, prod) => {
                            actualState.updateRoundProduct(
                              roundIdx,
                              pIdx,
                              "productId",
                              val,
                            );
                            actualState.updateRoundProduct(
                              roundIdx,
                              pIdx,
                              "productName",
                              prod?.name || "",
                            );
                            if (prod?.unit) {
                              actualState.updateRoundProduct(
                                roundIdx,
                                pIdx,
                                "unit",
                                prod.unit,
                              );
                            }
                          }}
                          disabled={readonly}
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <ActivityInput
                          type="number"
                          value={p.quantityUsed}
                          onChange={(e) =>
                            actualState.updateRoundProduct(
                              roundIdx,
                              pIdx,
                              "quantityUsed",
                              e.target.value,
                            )
                          }
                          placeholder="จำนวน"
                          disabled={readonly}
                        />
                      </div>
                      <div className="col-span-3 sm:col-span-2">
                        <ActivityInput
                          value={p.unit || "ขวด"}
                          onChange={(e) =>
                            actualState.updateRoundProduct(
                              roundIdx,
                              pIdx,
                              "unit",
                              e.target.value,
                            )
                          }
                          placeholder="หน่วย"
                          disabled={readonly}
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-3">
                        <ActivityInput
                          value={p.actualRate || ""}
                          onChange={(e) =>
                            actualState.updateRoundProduct(
                              roundIdx,
                              pIdx,
                              "actualRate",
                              e.target.value,
                            )
                          }
                          placeholder="อัตราใช้จริง"
                          disabled={readonly}
                        />
                      </div>
                      {!readonly && (
                        <div className="col-span-1 flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              actualState.removeRoundProduct(roundIdx, pIdx)
                            }
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground text-center py-2">
                  ไม่มีสินค้าเฉพาะรอบนี้
                </div>
              )}
            </div>

            {/* Photo Upload Section */}
            <div className="pt-2">
              <ActivityPhotoUpload
                title={`รูปถ่ายสภาพแปลงหลังการติดตามรอบที่ ${round.roundNumber || roundIdx + 1}`}
                description={`อัปโหลดภาพถ่ายสภาพพืช ผลการใช้สาร หรืออาการผิดปกติ (สูงสุด ${TYPE14_MAX_IMAGES_PER_VILLAGE} รูป)`}
                images={round.afterSprayImages || []}
                onImagesChange={(newImages: ImageFile[]) => {
                  actualState.updateRoundField(
                    roundIdx,
                    "afterSprayImages",
                    newImages,
                  );
                }}
                maxFiles={TYPE14_MAX_IMAGES_PER_VILLAGE}
                readonly={readonly}
                accentColor="emerald"
              />
            </div>
          </div>
        ))}

        {!readonly && (
          <Button
            type="button"
            variant="outline"
            onClick={actualState.addRound}
            className="w-full border-dashed border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
          >
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มรอบการติดตามผล (รอบที่ {rounds.length + 1})
          </Button>
        )}
      </div>
    </div>
  );
}

export const Type14Actual = Type14ActualForm;
