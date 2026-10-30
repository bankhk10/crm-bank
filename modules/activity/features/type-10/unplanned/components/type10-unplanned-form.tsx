"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Sprout, Plus, Trash2, MapPin, Users, ShoppingBag, ThumbsUp, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ActivityInput,
  ActivityPhotoUpload,
  ActivityProductSelect,
  ActivityCombobox,
} from "@/modules/activity/ui";
import { getDemoPlotsAction } from "@/modules/activity/server/actions";
import { FARMER_FEEDBACK_OPTIONS, type FarmerFeedback } from "../../shared/constants";
import type { Type10DemoPlotOption } from "../../shared/types";
import type {
  Type10UnplannedFormProps,
  Type10UnplannedItem,
} from "../types/unplanned.types";

export type { Type10UnplannedFormProps };

export function Type10UnplannedForm({
  readonly = false,
  items = [],
  demoPlots = [],
  products = [],
  addItem,
  updateItem,
  deleteItem,
  addSoldProduct,
  updateSoldProduct,
  deleteSoldProduct,
}: Type10UnplannedFormProps) {
  const [dbPlots, setDbPlots] = useState<Type10DemoPlotOption[]>([]);

  useEffect(() => {
    let isMounted = true;
    getDemoPlotsAction()
      .then((res: any) => {
        if (isMounted && res?.success && res.demoPlots && res.demoPlots.length > 0) {
          setDbPlots(res.demoPlots as any);
        }
      })
      .catch((err) => {
        console.error("Failed to load demo plots in Type10UnplannedForm:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const combinedMap = new Map<string, Type10DemoPlotOption>();
  demoPlots.forEach((p: any) => {
    if (p.id) combinedMap.set(p.id, p);
    else if (p.name) combinedMap.set(p.name, p);
  });
  dbPlots.forEach((p) => {
    if (p.id) combinedMap.set(p.id, p);
    else if (p.name) combinedMap.set(p.name, p);
  });

  // Fallback resilience for Edit mode:
  // Synthesize option if item's demoPlotId or plotName is not yet in combinedMap
  items.forEach((it) => {
    const key = it.demoPlotId || it.plotName;
    if (key && !combinedMap.has(key)) {
      combinedMap.set(key, {
        id: key,
        name: it.plotName || key,
        location: it.location || "",
        ownerName: it.farmerName || "",
        cropName: it.cropName || "",
        showcase: it.showcaseProduct || "",
      } as any);
    }
  });

  const plotList = Array.from(combinedMap.values());
  const plotOptions = plotList.map((plot) => ({
    value: plot.id || plot.name,
    label: `${plot.ownerName ? `${plot.ownerName} - ` : ""}${plot.name || "ไม่มีชื่อแปลง"}${
      plot.location ? ` (${plot.location})` : ""
    }`,
  }));

  const boxProducts = useMemo(() => {
    const list = products || [];
    const filtered = (list as any[]).filter((p: any) => {
      if (!p) return false;
      const u = typeof p === "object" ? p.unit || p.packageSizeUnit : "";
      return (
        u && (String(u).trim() === "กล่อง" || String(u).toUpperCase() === "BOX")
      );
    });
    return filtered.length > 0 ? filtered : list;
  }, [products]);

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm sm:text-base">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
            <Sprout className="h-4 w-4" />
          </div>
          <span>จัดงาน Field Day (นอกแผน / Type 10)</span>
        </div>

        {!readonly && addItem && (
          <Button
            type="button"
            size="sm"
            onClick={addItem}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg h-8 px-3 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            เพิ่มงาน Field Day
          </Button>
        )}
      </div>

      {/* Items list */}
      <div className="space-y-5">
        {items.map((item, index) => {
          const foundPlot = plotList.find(
            (p) => p.id === item.demoPlotId || p.name === item.plotName,
          );

          const handleSelectPlot = (val: string) => {
            const p = plotList.find((plot) => plot.id === val || plot.name === val);
            if (p) {
              updateItem(item.id, "demoPlotId", p.id || null);
              updateItem(item.id, "plotName", p.name || val);
              updateItem(item.id, "farmerName", p.ownerName || p.farmerName || "");
              updateItem(item.id, "cropName", p.cropName || p.targetCrop || "");
              updateItem(item.id, "showcaseProduct", p.showcase || p.productName || p.primaryProductName || "");
              updateItem(item.id, "location", p.location || "");
            } else {
              updateItem(item.id, "demoPlotId", null);
              updateItem(item.id, "plotName", val);
            }
          };

          return (
            <div
              key={item.id || index}
              className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4 shadow-2xs relative"
            >
              {/* Item Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    งาน Field Day รายการที่ {index + 1}
                  </span>
                </div>

                {!readonly && items.length > 1 && deleteItem && (
                  <button
                    type="button"
                    onClick={() => deleteItem(item.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Grid 2 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column: Plot Info */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      เลือกแปลงสาธิตที่จัดงาน <span className="text-red-500">*</span>
                    </label>
                    <ActivityCombobox
                      options={plotOptions}
                      value={item.demoPlotId || item.plotName}
                      onChange={handleSelectPlot}
                      placeholder="ค้นหาหรือเลือกแปลงสาธิต..."
                      searchPlaceholder="พิมพ์ชื่อแปลงหรือสถานที่..."
                      emptyText="ไม่พบแปลงสาธิตในระบบ"
                      disabled={readonly}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      สถานที่จัดงาน
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400">
                        <MapPin className="w-4 h-4" />
                      </span>
                      <ActivityInput
                        placeholder="ระบุสถานที่ หรือ จุดสังเกต..."
                        value={item.location || ""}
                        onChange={(e) => updateItem(item.id, "location", e.target.value)}
                        disabled={readonly}
                        className="h-10 pl-9 text-xs font-medium text-slate-800 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        พืชเป้าหมาย
                      </label>
                      <ActivityInput
                        placeholder="เช่น ข้าวโพด, ทุเรียน..."
                        value={item.cropName || ""}
                        onChange={(e) => updateItem(item.id, "cropName", e.target.value)}
                        disabled={readonly}
                        className="h-9 text-xs font-medium text-slate-800 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        สินค้าจัดแสดง
                      </label>
                      <ActivityInput
                        placeholder="เช่น แฮตแทค, ปุ๋ย..."
                        value={item.showcaseProduct || ""}
                        onChange={(e) => updateItem(item.id, "showcaseProduct", e.target.value)}
                        disabled={readonly}
                        className="h-9 text-xs font-medium text-slate-800 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: Actual Results */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      จำนวนผู้เข้าร่วมงานจริง (คน) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400">
                        <Users className="w-4 h-4" />
                      </span>
                      <ActivityInput
                        type="number"
                        min={0}
                        placeholder="ระบุจำนวนผู้เข้าร่วมงานจริง..."
                        value={item.actualAttendees || ""}
                        onChange={(e) => updateItem(item.id, "actualAttendees", e.target.value)}
                        disabled={readonly}
                        className="h-10 pl-9 text-xs font-bold text-slate-800 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ยอดขายหรือยอดจองจริง (บาท)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-semibold">
                        ฿
                      </span>
                      <ActivityInput
                        type="text"
                        placeholder="0.00"
                        value={item.actualSalesOrBooking || ""}
                        onChange={(e) => updateItem(item.id, "actualSalesOrBooking", e.target.value)}
                        disabled={readonly}
                        className="h-10 pl-7 text-xs font-bold text-emerald-800 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                      <ThumbsUp className="w-3.5 h-3.5 text-slate-500" />
                      <span>ผลตอบรับจากเกษตรกร</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {FARMER_FEEDBACK_OPTIONS.map((opt) => {
                        const isSelected = item.farmerFeedback === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            disabled={readonly}
                            onClick={() => updateItem(item.id, "farmerFeedback", opt.value)}
                            className={cn(
                              "py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all text-center",
                              isSelected
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100",
                            )}
                          >
                            {opt.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sold Products Section */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-emerald-600" />
                    <span>รายการสินค้าที่สั่งจอง / จำหน่ายในงาน</span>
                  </span>

                  {!readonly && addSoldProduct && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addSoldProduct(item.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      เพิ่มสินค้า
                    </Button>
                  )}
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-2 px-3 text-center w-10">ลำดับ</th>
                        <th className="py-2 px-3 min-w-[180px]">รายการสินค้า</th>
                        <th className="py-2 px-3 w-28 text-center">จำนวน</th>
                        <th className="py-2 px-3 w-32 text-center">ราคาต่อหน่วย</th>
                        <th className="py-2 px-3 w-32 text-right">รวม (บาท)</th>
                        {!readonly && <th className="py-2 px-3 text-center w-12">ลบ</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {!item.soldProducts || item.soldProducts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-3 text-center text-slate-400">
                            ยังไม่มีรายการสินค้า กดปุ่ม &quot;เพิ่มสินค้า&quot; เพื่อบันทึกยอดจำหน่าย
                          </td>
                        </tr>
                      ) : (
                        item.soldProducts.map((p, pIdx) => (
                          <tr key={p.id || pIdx}>
                            <td className="py-2 px-3 text-center font-medium text-slate-500">
                              {pIdx + 1}
                            </td>
                            <td className="py-1.5 px-3">
                              <ActivityProductSelect
                                id={`t10-unplanned-prod-${item.id}-${pIdx}`}
                                triggerClassName="h-8 min-h-[32px] py-0.5 text-xs bg-white border-slate-200 rounded-md text-slate-800 focus:ring-2 focus:ring-emerald-500"
                                value={p.productName}
                                valueKey="name"
                                onChange={(val, pFound) => {
                                  if (updateSoldProduct) {
                                    const price =
                                      pFound?.price != null && !isNaN(Number(pFound.price))
                                        ? Number(pFound.price)
                                        : Number(p.unitPrice) || 0;
                                    const qty = Number(p.actualQty) || 1;
                                    updateSoldProduct(item.id, p.id!, {
                                      productId: pFound?.id || p.productId || "",
                                      productName: pFound?.name || val || "",
                                      productCode: pFound?.productCode || p.productCode || null,
                                      unitPrice: price,
                                      actualQty: qty,
                                      actualSales: qty * price,
                                    });
                                  }
                                }}
                                products={boxProducts as any}
                                placeholder="เลือกสินค้า (เฉพาะหน่วยกล่อง)..."
                                searchPlaceholder="ค้นหาสินค้า..."
                                emptyText="ไม่พบสินค้าหน่วยกล่อง"
                                disabled={readonly}
                              />
                            </td>
                            <td className="py-1.5 px-3">
                              <ActivityInput
                                type="number"
                                min={0}
                                placeholder="0"
                                value={p.actualQty ?? ""}
                                onChange={(e) => {
                                  const qty = Number(e.target.value) || 0;
                                  const price = Number(p.unitPrice) || 0;
                                  if (updateSoldProduct) {
                                    updateSoldProduct(item.id, p.id!, "actualQty", e.target.value);
                                    updateSoldProduct(item.id, p.id!, "actualSales", qty * price);
                                  }
                                }}
                                disabled={readonly}
                                className="h-8 text-xs text-center font-bold text-slate-800"
                              />
                            </td>
                            <td className="py-1.5 px-3">
                              <ActivityInput
                                type="number"
                                min={0}
                                placeholder="0.00"
                                value={p.unitPrice ?? ""}
                                onChange={(e) => {
                                  const price = Number(e.target.value) || 0;
                                  const qty = Number(p.actualQty) || 0;
                                  if (updateSoldProduct) {
                                    updateSoldProduct(item.id, p.id!, "unitPrice", e.target.value);
                                    updateSoldProduct(item.id, p.id!, "actualSales", qty * price);
                                  }
                                }}
                                disabled={readonly}
                                className="h-8 text-xs text-center font-bold text-slate-800"
                              />
                            </td>
                            <td className="py-1.5 px-3 text-right font-bold text-emerald-800">
                              {Number(p.actualSales || 0).toLocaleString()} ฿
                            </td>
                            {!readonly && deleteSoldProduct && (
                              <td className="py-1.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => deleteSoldProduct(item.id, p.id!)}
                                  className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Photo Upload: Atmosphere */}
              <div className="pt-2 border-t border-slate-100">
                <ActivityPhotoUpload
                  title="ภาพถ่ายบรรยากาศการจัดงาน Field Day"
                  description="อัปโหลดภาพถ่ายกิจกรรม เกษตรกรผู้เข้าร่วมงาน และบรรยากาศในแปลงสาธิต"
                  images={(item.images || []) as any}
                  onImagesChange={(imgs) => updateItem(item.id, "images", imgs as any)}
                  maxFiles={10}
                  accentColor="emerald"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
