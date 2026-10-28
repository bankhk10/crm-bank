"use client";

import React from "react";
import { Package, Clock, Activity, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  ActivityInput,
  ActivitySelect,
  ActivityPhotoUpload,
  type ImageFile,
} from "@/modules/activity/ui";
import {
  TRACKING_RESULT_OPTIONS,
  PRODUCT_RESPONSE_OPTIONS,
  HATTACK_PLOT_STATUS_OPTIONS,
  TYPE14_MAX_IMAGES_PER_VILLAGE,
} from "../../shared/constants";
import type {
  Type14PlotActualState,
  Type14ActualProductState,
  ProductOption,
} from "../../shared/types";
import type { Type14ActualProps, Type14ActualFormProps } from "../types/actual.types";

export type { Type14ActualProps, Type14ActualFormProps };

export function Type14ActualForm({
  isVisible = true,
  actualState,
  dealers = [],
  targets = [],
  readonly = false,
  className = "",
}: Type14ActualProps) {
  if (!isVisible || !actualState) return null;

  const {
    plotsActual = [],
    updatePlotField,
    updatePlotProduct,
    setPlotsActual,
  } = actualState;

  // Fallback plots from targets if state is empty initially
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
      daysAfterSpray: "",
      trackingResult: "ได้ผลตามเกณฑ์",
      productResponse: "ปกติ",
      additionalNotes: "",
      products: (t.products || []).map((tp: any) => ({
        productId: tp.productId || tp.product?.id || tp.id,
        productName: tp.productName || tp.product?.name || tp.name || "สินค้าตามแผน",
        unit: tp.unit || tp.product?.unit || "ขวด",
        withdrawnQuantity: tp.quantity ?? tp.withdrawnQuantity ?? 1,
        actualQuantity: tp.actualQuantity ?? tp.quantity ?? tp.withdrawnQuantity ?? 1,
        extraQuantity: tp.extraQuantity || "",
        extraUnit: tp.extraUnit || "ซีซี",
        actualRate: tp.actualRate || "",
        quantityUsed: tp.actualQuantity ?? tp.quantity ?? tp.withdrawnQuantity ?? 1,
      })),
      afterSprayImages: [],
    }));
  }, [targets]);

  const plotsList: Type14PlotActualState[] =
    plotsActual.length > 0 ? plotsActual : fallbackPlots;

  // Auto-sync fallback plots if state is initially empty
  React.useEffect(() => {
    if (plotsActual.length === 0 && fallbackPlots.length > 0 && setPlotsActual) {
      setPlotsActual(fallbackPlots);
    }
  }, [plotsActual.length, fallbackPlots, setPlotsActual]);

  const handleUpdateProduct = (
    plotIdx: number,
    prodIdx: number,
    field: keyof Type14ActualProductState,
    value: any,
    currentProds: Type14ActualProductState[],
  ) => {
    if (readonly) return;
    if (updatePlotProduct) {
      updatePlotProduct(plotIdx, prodIdx, field, value, currentProds);
    } else {
      const updatedProds = [...currentProds];
      if (updatedProds[prodIdx]) {
        updatedProds[prodIdx] = { ...updatedProds[prodIdx], [field]: value };
        if (field === "actualQuantity") {
          updatedProds[prodIdx].quantityUsed = value;
        }
      }
      updatePlotField?.(plotIdx, "products", updatedProds);
    }
  };

  const handleImagesChange = (plotIdx: number, imgs: ImageFile[]) => {
    if (readonly) return;
    updatePlotField?.(plotIdx, "afterSprayImages", imgs);
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 space-y-6 shadow-2xs ${className}`}>
      {/* Title */}
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
              บันทึกจำนวนแปลงที่ติดตามจริง, สินค้าที่ใช้ และรูปถ่ายผลงานหลังติดตามแปลง
            </p>
          </div>
        </div>
      </div>

      {/* Plots Stacked List */}
      <div className="space-y-6">
        {plotsList.map((plot: Type14PlotActualState, plotIdx: number) => {
          // Resolve target for this plot
          const matchedTarget =
            targets?.[plotIdx] ||
            targets?.find(
              (t: any) =>
                (t.id && (t.id === plot.id || t.id === plot.demoPlotId)) ||
                (t.demoPlotId && t.demoPlotId === plot.demoPlotId) ||
                (t.type13TargetId && t.type13TargetId === plot.type13TargetId),
            );

          // Resolve Dealer name
          const matchedDealer = dealers?.find(
            (d: any) =>
              d.id === plot.storeId || d.id === matchedTarget?.storeId,
          );
          const dealerDisplayName =
            plot.dealerName ||
            matchedDealer?.name ||
            matchedTarget?.dealerName ||
            (matchedTarget as any)?.store?.name ||
            "-";

          // Resolve Location string
          const locParts = [
            plot.subdistrict
              ? `ต.${plot.subdistrict}`
              : matchedTarget?.subdistrict
                ? `ต.${matchedTarget.subdistrict}`
                : null,
            plot.district
              ? `อ.${plot.district}`
              : matchedTarget?.district
                ? `อ.${matchedTarget.district}`
                : null,
            plot.province
              ? `จ.${plot.province}`
              : matchedTarget?.province
                ? `จ.${matchedTarget.province}`
                : null,
          ].filter(Boolean);
          const locationText = locParts.length > 0 ? locParts.join(" ") : null;

          const ownerDisplayName =
            plot.ownerName || matchedTarget?.ownerName || "-";
          const villageDisplayName =
            plot.village || matchedTarget?.village || "-";

          const plannedCount =
            plot.plannedPlotsCount != null && plot.plannedPlotsCount !== ""
              ? plot.plannedPlotsCount
              : matchedTarget?.plannedPlotsCount != null &&
                  matchedTarget.plannedPlotsCount !== ""
                ? matchedTarget.plannedPlotsCount
                : 1;

          // Resolve planned products for this plot
          const effectiveProducts: Type14ActualProductState[] = (() => {
            if (plot.products && plot.products.length > 0) {
              return plot.products;
            }
            const targetProds =
              (matchedTarget as any)?.withdrawnProducts ||
              matchedTarget?.products ||
              (matchedTarget as any)?.demoProducts ||
              [];

            if (targetProds.length > 0) {
              return targetProds.map((tp: any) => ({
                productId: tp.productId || tp.product?.id || tp.id,
                productName:
                  tp.productName ||
                  tp.product?.name ||
                  tp.name ||
                  "สินค้าตามแผน",
                unit: tp.unit || tp.product?.unit || "ขวด",
                withdrawnQuantity:
                  tp.quantity ?? tp.withdrawnQuantity ?? tp.targetQuantity ?? 1,
                actualQuantity:
                  tp.actualQuantity ?? tp.quantity ?? tp.withdrawnQuantity ?? 1,
                extraQuantity: tp.extraQuantity || "",
                extraUnit: tp.extraUnit || "ซีซี",
                actualRate: tp.actualRate || "",
                quantityUsed:
                  tp.actualQuantity ?? tp.quantity ?? tp.withdrawnQuantity ?? 1,
              }));
            }
            return [];
          })();

          return (
            <div
              key={plot.clientPlotId || plot.id || `plot-${plotIdx}`}
              className="bg-slate-50/60 rounded-2xl border border-slate-200/80 p-4 sm:p-5 space-y-5 shadow-2xs hover:border-emerald-200 transition-colors"
            >
              {/* 1. Header: Plot Index & Plot Name */}
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

              {/* 2. Display Section: ร้านค้า Dealer & เกษตรกร & หมู่บ้าน (Read-only presentation) */}
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

              {/* 3. Input: จำนวนแปลงที่ติดตามจริง (เหมือน Type 13) */}
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
                      updatePlotField?.(
                        plotIdx,
                        "actualPlotsCount",
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    disabled={readonly}
                    required
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* 4. Section 1.1 สินค้าที่เบิกตามแผน (Planned Demo Products) */}
              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                      1.1 สินค้าที่เบิกตามแผน (Planned Demo Products)
                    </h4>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-semibold px-2 py-0.5"
                  >
                    {effectiveProducts.length} รายการ
                  </Badge>
                </div>

                {effectiveProducts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-3 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    ไม่มีรายการสินค้าตัวอย่างที่ขอเบิกไว้ในแผนงานสำหรับแปลงนี้
                  </p>
                ) : (
                  <div className="space-y-3">
                    {effectiveProducts.map((prod, prodIdx) => (
                      <div
                        key={prod.productId || prodIdx}
                        className="bg-emerald-50/40 border border-emerald-200/70 rounded-xl p-3.5 sm:p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {prodIdx + 1}.{" "}
                            {prod.productName || "สินค้าตัวอย่าง"}
                          </span>
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-md">
                            จำนวนที่เบิก:{" "}
                            {prod.withdrawnQuantity ||
                              prod.plannedQuantity ||
                              1}{" "}
                            {prod.unit || "ขวด"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* 1. จำนวนที่ใช้จริง (ขวด) */}
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">
                              จำนวนที่ใช้จริง (ขวด){" "}
                              <span className="text-rose-500">*</span>
                            </label>
                            <ActivityInput
                              type="number"
                              min="0"
                              value={
                                prod.actualQuantity != null
                                  ? String(prod.actualQuantity)
                                  : ""
                              }
                              onChange={(e) =>
                                handleUpdateProduct(
                                  plotIdx,
                                  prodIdx,
                                  "actualQuantity",
                                  e.target.value,
                                  effectiveProducts,
                                )
                              }
                              disabled={readonly}
                              placeholder="เช่น 1"
                              required
                            />
                          </div>

                          {/* 2. ปริมาณที่ใช้เพิ่ม (กรณีใช้ไปครึ่งขวด) */}
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">
                              ปริมาณที่ใช้เพิ่ม (กรณีใช้ไปครึ่งขวด)
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <ActivityInput
                                type="number"
                                min="0"
                                value={
                                  prod.extraQuantity != null
                                    ? String(prod.extraQuantity)
                                    : ""
                                }
                                onChange={(e) =>
                                  handleUpdateProduct(
                                    plotIdx,
                                    prodIdx,
                                    "extraQuantity",
                                    e.target.value,
                                    effectiveProducts,
                                  )
                                }
                                disabled={readonly}
                                placeholder="เช่น 250"
                              />
                              <ActivitySelect
                                value={prod.extraUnit || "ซีซี"}
                                onChange={(val) =>
                                  handleUpdateProduct(
                                    plotIdx,
                                    prodIdx,
                                    "extraUnit",
                                    val,
                                    effectiveProducts,
                                  )
                                }
                                options={[
                                  { value: "ซีซี", label: "ซีซี (ขวด)" },
                                  { value: "กรัม", label: "กรัม (ซอง)" },
                                ]}
                                disabled={readonly}
                              />
                            </div>
                          </div>

                          {/* 3. อัตราการใช้ */}
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700">
                              อัตราการใช้{" "}
                              <span className="text-rose-500">*</span>
                            </label>
                            <ActivityInput
                              value={
                                prod.actualRate || prod.applicationRate || ""
                              }
                              onChange={(e) =>
                                handleUpdateProduct(
                                  plotIdx,
                                  prodIdx,
                                  "actualRate",
                                  e.target.value,
                                  effectiveProducts,
                                )
                              }
                              disabled={readonly}
                              placeholder="เช่น 20 ซีซี / น้ำ 20 ลิตร"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. Section 1.2 ผลการตรวจติดตามแปลง (Follow-up Observation) */}
              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                    1.2 ผลการตรวจติดตามแปลง
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* ระยะเวลาหลังฉีดพ่น (วัน) */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      ระยะเวลาหลังฉีดพ่น (วัน)
                    </label>
                    <ActivityInput
                      type="number"
                      min="0"
                      placeholder="เช่น 7, 14, 21"
                      value={plot.daysAfterSpray != null ? String(plot.daysAfterSpray) : ""}
                      onChange={(e) =>
                        updatePlotField?.(plotIdx, "daysAfterSpray", e.target.value)
                      }
                      disabled={readonly}
                      className="h-9 text-xs"
                    />
                  </div>

                  {/* ผลการติดตามแปลง */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      ผลการติดตามแปลง <span className="text-rose-500">*</span>
                    </label>
                    <ActivitySelect
                      value={plot.trackingResult || "ได้ผลตามเกณฑ์"}
                      onChange={(val) =>
                        updatePlotField?.(plotIdx, "trackingResult", val)
                      }
                      options={[...TRACKING_RESULT_OPTIONS]}
                      disabled={readonly}
                    />
                  </div>

                  {/* การตอบสนองของพืช */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      การตอบสนองของพืช
                    </label>
                    <ActivitySelect
                      value={plot.productResponse || "ปกติ"}
                      onChange={(val) =>
                        updatePlotField?.(plotIdx, "productResponse", val)
                      }
                      options={[...PRODUCT_RESPONSE_OPTIONS]}
                      disabled={readonly}
                    />
                  </div>
                </div>

                {/* บันทึกข้อสังเกตเพิ่มเติม / ปัญหาที่พบ */}
                <div className="space-y-1 pt-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    บันทึกข้อสังเกตเพิ่มเติม / ปัญหาที่พบ
                  </label>
                  <ActivityInput
                    placeholder="ระบุข้อสังเกต สภาพพืช อาการ หรือแนวทางแก้ไข..."
                    value={plot.additionalNotes || ""}
                    onChange={(e) =>
                      updatePlotField?.(plotIdx, "additionalNotes", e.target.value)
                    }
                    disabled={readonly}
                    className="h-9 text-xs"
                  />
                </div>

                {/* สถานะของแปลงแฮตแทค (Plot Status) */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      สถานะของแปลงแฮตแทคหลังการติดตามรอบนี้ <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      {HATTACK_PLOT_STATUS_OPTIONS.map((opt) => {
                        const isSelected = (plot.plotStatus || "IN_PROGRESS") === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            disabled={readonly}
                            onClick={() => updatePlotField?.(plotIdx, "plotStatus", opt.value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                              isSelected
                                ? opt.value === "COMPLETED"
                                  ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                                  : "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {opt.value === "COMPLETED" ? "ปิดแปลงแล้ว (สิ้นสุดการทดลอง)" : "ต้องติดตามต่อ"}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {plot.plotStatus === "COMPLETED" && (
                    <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/80 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>แปลงนี้จะถูกบันทึกเป็น "ปิดแปลงแล้ว" (ไม่แสดงในรายการสร้างแผนติดตามรอบใหม่)</span>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-emerald-900">
                          สรุปผลการปิดแปลง / ความพึงพอใจของเกษตรกร
                        </label>
                        <ActivityInput
                          placeholder="เช่น ผลการควบคุมหนอนดีเยี่ยม เกษตรกรพึงพอใจมาก แปลงสมบูรณ์พร้อมเก็บเกี่ยว..."
                          value={plot.closureNotes || ""}
                          onChange={(e) => updatePlotField?.(plotIdx, "closureNotes", e.target.value)}
                          disabled={readonly}
                          className="h-9 text-xs bg-white border-emerald-200"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 6. Section 1.3 รูปหลังติดตามแปลง (ต่อหมู่บ้าน) using ActivityPhotoUpload */}
              <ActivityPhotoUpload
                title="รูปหลังติดตามแปลง (ต่อหมู่บ้าน)"
                description={`รองรับไฟล์รูปภาพ PNG, JPG หรือ WEBP (สูงสุด ${TYPE14_MAX_IMAGES_PER_VILLAGE} รูปต่อหมู่บ้าน)`}
                images={(plot.afterSprayImages as any) || []}
                onImagesChange={(imgs) => handleImagesChange(plotIdx, imgs)}
                maxFiles={TYPE14_MAX_IMAGES_PER_VILLAGE}
                accentColor="emerald"
                readonly={readonly}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const Type14Actual = Type14ActualForm;
