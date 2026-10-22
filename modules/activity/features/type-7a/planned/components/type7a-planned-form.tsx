"use client";

import React from "react";
import { Sprout, Plus, Trash2, MapPin, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ActivityInput,
  ActivityTextarea,
  ActivityCombobox,
  ActivityCustomerSelect,
  ActivityProductSelect,
  ActivityGpsPicker,
} from "@/modules/activity/ui";
import { CROP_CATEGORIES, PLOT_OBJECTIVES } from "../../shared/constants";
import type {
  Type7aPlannedFormProps,
  Type7aPlanItem,
} from "../types/planned.types";

export function Type7aPlannedForm({
  readonly = false,
  type7aPlots = [],
  addType7aRow,
  updateType7aRow,
  deleteType7aRow,
  addProductToDemoPlot,
  updateProductInDemoPlot,
  deleteProductFromDemoPlot,
  customers = [],
  products = [],
}: Type7aPlannedFormProps) {
  const cropCategoryOptions = CROP_CATEGORIES.map((c) => ({
    value: c,
    label: c,
  }));
  const objectiveOptions = PLOT_OBJECTIVES.map((o) => ({ value: o, label: o }));

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <Sprout className="h-4 w-4 text-emerald-600" />
          <span>จัดทำแปลงสาธิต</span>
        </div>
        {/* ปิดไว้ก่อนเดียวมาเปิดเอง */}
        {/* {!readonly && (
          <Button
            type="button"
            size="sm"
            onClick={addType7aRow}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            เพิ่มแปลงสาธิต
          </Button>
        )} */}
      </div>

      {/* Plots List */}
      <div className="space-y-4">
        {type7aPlots.map((plot, index) => (
          <div
            key={plot.id}
            className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-4"
          >
            {/* Plot Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                แปลงสาธิตที่ {index + 1}
              </span>

              {!readonly && type7aPlots.length > 1 && (
                <button
                  type="button"
                  onClick={() => deleteType7aRow(plot.id)}
                  className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>ลบแปลง</span>
                </button>
              )}
            </div>

            {/* Row 1: ชื่อแปลง & เจ้าของแปลง (เกษตรกร) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  ชื่อแปลงสาธิต <span className="text-rose-500">*</span>
                </label>
                <ActivityInput
                  value={plot.plotName || ""}
                  onChange={(e) =>
                    updateType7aRow(plot.id, "plotName", e.target.value)
                  }
                  disabled={readonly}
                  placeholder="เช่น แปลงข้าว กข43 นาลุงสมชาย"
                  required
                />
              </div>

              <ActivityCustomerSelect
                id={`customer-combobox-${plot.id}`}
                type="FARMER"
                label="เจ้าของแปลง (เกษตรกร) / ร้านค้า"
                labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                value={plot.storeId || plot.ownerName || plot.farmerName || ""}
                onChange={(val, cust) => {
                  updateType7aRow(plot.id, "ownerName", cust?.name || val);
                  updateType7aRow(plot.id, "farmerName", cust?.name || val);
                  if (cust?.id) {
                    updateType7aRow(plot.id, "storeId", cust.id);
                  }
                  if (cust?.province) {
                    updateType7aRow(plot.id, "province", cust.province);
                  }
                  if (cust?.district) {
                    updateType7aRow(plot.id, "district", cust.district);
                  }
                }}
                customers={customers as any}
                placeholder="เลือกเกษตรกร หรือพิมพ์ชื่อ..."
                searchPlaceholder="ค้นหาเกษตรกร / ร้านค้า..."
                emptyText="ไม่พบข้อมูล"
                disabled={readonly}
                required
              />
            </div>

            {/* Row 2: หมวดหมู่พืช, ชนิดพืช, พื้นที่ปลูก */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <ActivityCombobox
                label="กลุ่มพืช"
                labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                options={cropCategoryOptions}
                value={plot.cropCategory || ""}
                onChange={(val) =>
                  updateType7aRow(plot.id, "cropCategory", val)
                }
                placeholder="เลือกกลุ่มพืช..."
                disabled={readonly}
                required
              />

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  ชนิดพืช / สายพันธุ์ <span className="text-rose-500">*</span>
                </label>
                <ActivityInput
                  value={plot.cropName || plot.customCropName || ""}
                  onChange={(e) => {
                    updateType7aRow(plot.id, "cropName", e.target.value);
                    updateType7aRow(plot.id, "customCropName", e.target.value);
                  }}
                  disabled={readonly}
                  placeholder="เช่น ข้าว กข43, ทุเรียนหมอนทอง"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  พื้นที่แปลง (ไร่)
                </label>
                <ActivityInput
                  type="number"
                  value={plot.areaRai != null ? String(plot.areaRai) : ""}
                  onChange={(e) =>
                    updateType7aRow(
                      plot.id,
                      "areaRai",
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                  disabled={readonly}
                  placeholder="เช่น 5"
                />
              </div>
            </div>

            {/* Row 3: วัตถุประสงค์ & รายละเอียด */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ActivityCombobox
                label="วัตถุประสงค์การจัดทำแปลง"
                labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                options={objectiveOptions}
                value={plot.objective || ""}
                onChange={(val) => updateType7aRow(plot.id, "objective", val)}
                placeholder="เลือกวัตถุประสงค์..."
                disabled={readonly}
              />

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  หมายเหตุ / แผนการทดสอบ
                </label>
                <ActivityInput
                  value={plot.notes || ""}
                  onChange={(e) =>
                    updateType7aRow(plot.id, "notes", e.target.value)
                  }
                  disabled={readonly}
                  placeholder="ระบุแนวทางการทดสอบหรือรายละเอียดเพิ่มเติม..."
                />
              </div>
            </div>

            {/* Row 4: พิกัดแปลง GPS */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                พิกัดแปลงสาธิต (GPS)
              </label>
              <ActivityGpsPicker
                latitude={
                  plot.latitude != null ? String(plot.latitude) : undefined
                }
                longitude={
                  plot.longitude != null ? String(plot.longitude) : undefined
                }
                onLocationChange={(lat: string, lng: string) => {
                  updateType7aRow(plot.id, "latitude", lat);
                  updateType7aRow(plot.id, "longitude", lng);
                }}
                readonly={readonly}
              />
            </div>

            {/* Row 5: รายการสินค้าที่ใช้ทดสอบสาธิต */}
            <div className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-emerald-700" />
                  สินค้าที่นำไปทดสอบสาธิต
                </span>

                {!readonly && addProductToDemoPlot && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => addProductToDemoPlot(plot.id)}
                    className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    เพิ่มสินค้า
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {(plot.demoProducts || plot.products || []).map(
                  (prod, pIdx) => (
                    <div
                      key={prod.id || pIdx}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-white p-2.5 rounded-lg border border-slate-200 items-center shadow-2xs"
                    >
                      <div className="sm:col-span-7">
                        <ActivityProductSelect
                          label="เลือกสินค้า"
                          labelClassName="text-[11px] text-slate-600 mb-0.5"
                          products={products as any}
                          value={prod.productId || ""}
                          valueKey="id"
                          onChange={(val, pObj) => {
                            if (updateProductInDemoPlot) {
                              updateProductInDemoPlot(
                                plot.id,
                                pIdx,
                                "productId",
                                val,
                              );
                              updateProductInDemoPlot(
                                plot.id,
                                pIdx,
                                "productName",
                                pObj?.name || "",
                              );
                            }
                          }}
                          disabled={readonly}
                          placeholder="เลือกสินค้า..."
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="text-[11px] text-slate-600 block mb-0.5">
                          จำนวนที่ใช้
                        </label>
                        <ActivityInput
                          type="number"
                          value={
                            prod.quantity != null ? String(prod.quantity) : ""
                          }
                          onChange={(e) => {
                            if (updateProductInDemoPlot) {
                              updateProductInDemoPlot(
                                plot.id,
                                pIdx,
                                "quantity",
                                e.target.value ? Number(e.target.value) : 0,
                              );
                              updateProductInDemoPlot(
                                plot.id,
                                pIdx,
                                "targetQuantity",
                                e.target.value ? Number(e.target.value) : 0,
                              );
                            }
                          }}
                          disabled={readonly}
                          placeholder="จำนวน"
                          className="h-9 text-xs"
                        />
                      </div>

                      {!readonly && deleteProductFromDemoPlot && (
                        <div className="sm:col-span-2 flex justify-end pt-4 sm:pt-0">
                          <button
                            type="button"
                            onClick={() =>
                              deleteProductFromDemoPlot(plot.id, pIdx)
                            }
                            className="text-rose-500 hover:text-rose-700 p-1.5 rounded-md hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Backward-compatible aliases
export const Type7aPlanForm = Type7aPlannedForm;
export const Type7NewDemo = Type7aPlannedForm;
export const EditType7aNewDemo = Type7aPlannedForm;
