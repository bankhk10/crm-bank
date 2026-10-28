"use client";

import React from "react";
import { Plus, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ActivityInput,
  ActivitySelect,
  ActivityPhotoUpload,
  type ImageFile,
} from "@/modules/activity/ui";
import type {
  Type13PlotActualState,
  Type13ActualProductState,
  Type13ActualProps,
  Type13ActualFormProps,
} from "../types/actual.types";

export type { Type13ActualProps, Type13ActualFormProps };

export function Type13ActualForm({
  isVisible = true,
  actualState,
  dealers = [],
  targets = [],
  readonly = false,
}: Type13ActualProps) {
  const {
    plotsActual = [],
    addPlot,
    removePlot,
    updatePlotField,
    updatePlotProduct,
  } = actualState || {};

  if (!isVisible) return null;

  const handleAddPlot = () => {
    if (plotsActual.length >= 10 || readonly) return;
    addPlot?.();
  };

  const handleDeletePlot = (index: number) => {
    if (plotsActual.length <= 1 || readonly) return;
    removePlot?.(index);
  };

  const handleUpdateProduct = (
    plotIdx: number,
    prodIdx: number,
    field: keyof Type13ActualProductState,
    value: any,
    currentProds: Type13ActualProductState[],
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
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 space-y-6 shadow-2xs">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 font-bold">
            13
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <span>บันทึกผลงานจริง: ฉีดแปลงแฮตแทค (TYPE_13)</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                {plotsActual.length} แปลง
              </span>
            </h4>
            <p className="text-xs text-slate-500">
              บันทึกจำนวนแปลงที่ฉีดพ่นจริง, สินค้าที่ใช้
              และรูปถ่ายผลงานหลังฉีดพ่น
            </p>
          </div>
        </div>
        {/* ปิดไว้ก่อนเดียวมาเปิด */}
        {/* {!readonly && (
          <Button
            type="button"
            size="sm"
            onClick={handleAddPlot}
            disabled={plotsActual.length >= 10}
            className="h-9 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มแปลงแฮตแทคใหม่ ({plotsActual.length}/10)</span>
          </Button>
        )} */}
      </div>

      {/* Plots Stacked List */}
      <div className="space-y-6">
        {plotsActual.map((plot: Type13PlotActualState, plotIdx: number) => {
          // Resolve target for this plot
          const matchedTarget =
            targets?.[plotIdx] ||
            targets?.find(
              (t: any) =>
                (t.id &&
                  (t.id === plot.demoPlotId || t.id === (plot as any).id)) ||
                (t.demoPlotId && t.demoPlotId === plot.demoPlotId),
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
            matchedTarget?.store?.name ||
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

          // Resolve village
          const villageDisplayName =
            plot.village || matchedTarget?.village || "-";

          // Resolve objective
          const objectiveDisplayName =
            plot.objective || matchedTarget?.objective || null;

          // Resolve planned plots count
          const plannedCount =
            plot.plannedPlotsCount != null && plot.plannedPlotsCount !== ""
              ? plot.plannedPlotsCount
              : matchedTarget?.plannedPlotsCount != null &&
                  matchedTarget.plannedPlotsCount !== ""
                ? matchedTarget.plannedPlotsCount
                : null;

          // Resolve planned products for this plot
          const effectiveProducts: Type13ActualProductState[] = (() => {
            if (plot.products && plot.products.length > 0) {
              return plot.products;
            }
            const targetProds =
              matchedTarget?.withdrawnProducts ||
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
                actualRate: tp.actualRate || tp.applicationRate || "",
                quantityUsed:
                  tp.actualQuantity ?? tp.quantity ?? tp.withdrawnQuantity ?? 1,
              }));
            }
            return [];
          })();

          return (
            <div
              key={plot.clientPlotId || plot.demoPlotId || `plot-${plotIdx}`}
              className="bg-slate-50/60 rounded-2xl border border-slate-200/80 p-4 sm:p-5 space-y-5 shadow-2xs hover:border-emerald-200 transition-colors"
            >
              {/* 1. Header: Plot Index & Delete (No ชื่อแปลง input field) */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {plotIdx + 1}
                  </div>
                  <span className="font-bold text-slate-800 text-sm">
                    แปลงที่ {plotIdx + 1}
                  </span>
                  {dealerDisplayName !== "-" && (
                    <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                      (ตัวแทน: {dealerDisplayName})
                    </span>
                  )}
                </div>

                {!readonly && plotsActual.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePlot(plotIdx)}
                    className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg flex items-center gap-1 self-end sm:self-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบแปลงนี้</span>
                  </Button>
                )}
              </div>

              {/* 2. Display Section: ร้านค้า Dealer & หมู่บ้าน (Read-only presentation) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="block text-[11px] text-slate-400 font-medium">
                    ร้านค้า Dealer
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 block mt-0.5">
                    {dealerDisplayName}
                  </span>
                  {locationText && (
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {locationText}
                    </span>
                  )}
                </div>

                <div>
                  <span className="block text-[11px] text-slate-400 font-medium">
                    หมู่บ้าน
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 block mt-0.5">
                    {villageDisplayName}
                  </span>
                </div>

                {objectiveDisplayName && (
                  <div>
                    <span className="block text-[11px] text-slate-400 font-medium">
                      วัตถุประสงค์
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 block mt-0.5">
                      {objectiveDisplayName}
                    </span>
                  </div>
                )}

                {plannedCount != null && (
                  <div>
                    <span className="block text-[11px] text-slate-400 font-medium">
                      จำนวนแปลงตามแผน
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-emerald-800 block mt-0.5">
                      {plannedCount} แปลง
                    </span>
                  </div>
                )}
              </div>

              {/* 3. Input: จำนวนแปลงที่ฉีดพ่น */}
              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200">
                <div className="max-w-xs space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    จำนวนแปลงที่ฉีดพ่น (แปลง){" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <ActivityInput
                    type="number"
                    min={1}
                    placeholder={
                      plannedCount
                        ? `ตามแผน: ${plannedCount} แปลง`
                        : "ระบุจำนวนแปลงที่ฉีดจริง..."
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

              {/* 5. รูปหลังฉีดพ่น (ต่อหมู่บ้าน) using ActivityPhotoUpload */}
              <ActivityPhotoUpload
                title="รูปหลังฉีดพ่น (ต่อหมู่บ้าน)"
                description="รองรับไฟล์รูปภาพ PNG, JPG หรือ WEBP (สูงสุด 20 รูปต่อหมู่บ้าน)"
                images={(plot.afterSprayImages as any) || []}
                onImagesChange={(imgs) => handleImagesChange(plotIdx, imgs)}
                maxFiles={20}
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

export { Type13ActualForm as Type13Actual };
