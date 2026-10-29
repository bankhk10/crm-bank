"use client";

import React, { useMemo } from "react";
import { Sprout, Plus, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ActivityInput,
  ActivityCombobox,
  ActivityCustomerSelect,
  ActivityProductSelect,
} from "@/modules/activity/ui";
import {
  CROP_CATEGORIES,
  CROP_NAMES_BY_CATEGORY,
  OTHER_CROP_OPTIONS,
} from "../../shared/constants";
import type { Type7aPlannedFormProps } from "../types/planned.types";

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
  productCategories = [],
}: Type7aPlannedFormProps) {
  const cropCategoryOptions = useMemo(
    () =>
      CROP_CATEGORIES.map((c) => ({
        value: c,
        label: c,
      })),
    [],
  );

  const categoryOptions = useMemo(() => {
    if (productCategories && productCategories.length > 0) {
      return productCategories.map((c) => ({
        value: c.id,
        label: c.description
          ? `${c.code} - ${c.description}`
          : c.name || c.code,
      }));
    }

    const map = new Map<string, string>();
    for (const p of products) {
      const cat = (p as any).category;
      if (cat?.id) {
        const label = cat.description
          ? `${cat.code} - ${cat.description}`
          : cat.name || cat.code || cat.id;
        map.set(cat.id, label);
      } else if (p.categoryId && !map.has(p.categoryId)) {
        map.set(p.categoryId, p.categoryId);
      }
    }
    return Array.from(map.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [productCategories, products]);

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
        {type7aPlots.map((plot, index) => {
          const currentCategory = plot.cropCategory || "";
          const cropNameList = CROP_NAMES_BY_CATEGORY[currentCategory] || [];
          const cropNameOptions = cropNameList.map((name) => ({
            value: name,
            label: name,
          }));

          // Preserve existing cropName if loaded from DB and not in current list
          if (
            plot.cropName &&
            !cropNameOptions.some((o) => o.value === plot.cropName)
          ) {
            cropNameOptions.push({
              value: plot.cropName,
              label: plot.cropName,
            });
          }

          const isOtherCropSelected = OTHER_CROP_OPTIONS.includes(
            (plot.cropName || "") as any,
          );
          const isOrchard = currentCategory === "พืชสวน";

          return (
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

              {/* Row 1: ชื่อแปลง & ชื่อ ร้านค้า Dealer */}
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
                  type="DEALER"
                  label="ชื่อ ร้านค้า Dealer"
                  labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                  triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
                  value={
                    plot.storeId || plot.ownerName || plot.farmerName || ""
                  }
                  onChange={(val, cust) => {
                    updateType7aRow(
                      plot.id,
                      "storeId",
                      cust?.id || val || null,
                    );
                    updateType7aRow(plot.id, "ownerName", cust?.name || val);
                    updateType7aRow(plot.id, "farmerName", cust?.name || val);
                    if (cust?.province) {
                      updateType7aRow(plot.id, "province", cust.province);
                    }
                    if (cust?.district) {
                      updateType7aRow(plot.id, "district", cust.district);
                    }
                  }}
                  customers={customers as any}
                  placeholder="เลือกร้านค้า Dealer..."
                  searchPlaceholder="ค้นหาร้านค้า Dealer..."
                  emptyText="ไม่พบร้านค้า Dealer ในระบบ"
                  disabled={readonly}
                  required
                />
              </div>

              {/* Row 2: หมวดพืช, ชื่อพืช, (ระบุชื่อพืชเพิ่มเติม), พื้นที่ (ไร่) / จำนวนต้น */}
              <div
                className={
                  isOtherCropSelected
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
                    : "grid grid-cols-1 sm:grid-cols-3 gap-3"
                }
              >
                <ActivityCombobox
                  label="หมวดพืช"
                  labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                  options={cropCategoryOptions}
                  value={currentCategory}
                  onChange={(val) => {
                    updateType7aRow(plot.id, "cropCategory", val);
                    const nextAllowedCrops = CROP_NAMES_BY_CATEGORY[val] || [];
                    if (
                      plot.cropName &&
                      !nextAllowedCrops.includes(plot.cropName)
                    ) {
                      updateType7aRow(plot.id, "cropName", "");
                      updateType7aRow(plot.id, "customCropName", "");
                    }
                    if (val === "พืชสวน") {
                      updateType7aRow(plot.id, "areaRai", null);
                    } else {
                      updateType7aRow(plot.id, "treeCount", null);
                    }
                  }}
                  placeholder="เลือกหมวดพืช..."
                  disabled={readonly}
                  required
                />

                <ActivityCombobox
                  label="ชื่อพืช"
                  labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                  options={cropNameOptions}
                  value={plot.cropName || ""}
                  onChange={(val) => {
                    updateType7aRow(plot.id, "cropName", val);
                    if (!OTHER_CROP_OPTIONS.includes(val as any)) {
                      updateType7aRow(plot.id, "customCropName", "");
                    }
                  }}
                  placeholder={
                    currentCategory
                      ? "เลือกชื่อพืช..."
                      : "กรุณาเลือกหมวดพืชก่อน"
                  }
                  disabled={readonly || !currentCategory}
                  required
                />

                {isOtherCropSelected && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      ระบุชื่อพืชเพิ่มเติม{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <ActivityInput
                      value={plot.customCropName || ""}
                      onChange={(e) =>
                        updateType7aRow(
                          plot.id,
                          "customCropName",
                          e.target.value,
                        )
                      }
                      disabled={readonly}
                      placeholder="ระบุชื่อพืช..."
                      required
                    />
                  </div>
                )}

                {isOrchard ? (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      จำนวนต้น <span className="text-rose-500">*</span>
                    </label>
                    <ActivityInput
                      type="number"
                      min={1}
                      value={
                        plot.treeCount != null ? String(plot.treeCount) : ""
                      }
                      onChange={(e) =>
                        updateType7aRow(
                          plot.id,
                          "treeCount",
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                      disabled={readonly}
                      placeholder="เช่น 100"
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      พื้นที่ (ไร่) <span className="text-rose-500">*</span>
                    </label>
                    <ActivityInput
                      type="number"
                      min={0}
                      step="any"
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
                      required
                    />
                  </div>
                )}
              </div>

              {/* Row 3: วัตถุประสงค์การจัดทำแปลง (พิมพ์เอง) & หมายเหตุ */}
              <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    วัตถุประสงค์การจัดทำแปลง
                  </label>
                  <ActivityInput
                    value={plot.objective || ""}
                    onChange={(e) =>
                      updateType7aRow(plot.id, "objective", e.target.value)
                    }
                    disabled={readonly}
                    placeholder="ระบุวัตถุประสงค์การจัดทำแปลง..."
                  />
                </div>
                {/* ปิดไว้ก่อนเดียวมาเปิดเอง */}
                {/* <div className="space-y-1">
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
                </div> */}
              </div>

              {/* Row 4: รายการสินค้าที่ใช้ทดสอบสาธิต */}
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
                    (prod, pIdx) => {
                      const matchedProd = prod.productId
                        ? products.find((p) => p.id === prod.productId)
                        : undefined;
                      const selectedCategoryId =
                        prod.categoryId ||
                        matchedProd?.categoryId ||
                        plot.categoryId ||
                        "";

                      const filteredProducts = selectedCategoryId
                        ? products.filter(
                            (p) =>
                              (p.categoryId === selectedCategoryId ||
                                p.productGroupId === selectedCategoryId) &&
                              p.unit?.trim() !== "กล่อง", // ตัดสินค้าหน่วยกล่องออกตรงนี้
                          )
                        : [];

                      return (
                        <div
                          key={prod.id || pIdx}
                          className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-white p-2.5 rounded-lg border border-slate-200 items-center shadow-2xs"
                        >
                          <div className="sm:col-span-4">
                            <ActivityCombobox
                              label="หมวดสินค้า"
                              labelClassName="text-[11px] text-slate-600 mb-0.5 block"
                              options={categoryOptions}
                              value={selectedCategoryId}
                              onChange={(val) => {
                                if (updateProductInDemoPlot) {
                                  updateProductInDemoPlot(
                                    plot.id,
                                    pIdx,
                                    "categoryId",
                                    val,
                                  );
                                  if (
                                    matchedProd &&
                                    matchedProd.categoryId !== val &&
                                    matchedProd.productGroupId !== val
                                  ) {
                                    updateProductInDemoPlot(
                                      plot.id,
                                      pIdx,
                                      "productId",
                                      "",
                                    );
                                    updateProductInDemoPlot(
                                      plot.id,
                                      pIdx,
                                      "productName",
                                      "",
                                    );
                                  }
                                }
                                updateType7aRow(plot.id, "categoryId", val);
                              }}
                              disabled={readonly}
                              placeholder="เลือกหมวดสินค้า..."
                            />
                          </div>

                          <div className="sm:col-span-5">
                            <ActivityProductSelect
                              label="เลือกสินค้า"
                              labelClassName="text-[11px] text-slate-600 mb-0.5"
                              products={filteredProducts as any}
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
                              disabled={readonly || !selectedCategoryId}
                              placeholder={
                                selectedCategoryId
                                  ? "เลือกสินค้า..."
                                  : "กรุณาเลือกหมวดสินค้าก่อน"
                              }
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="text-[11px] text-slate-600 block mb-0.5">
                              จำนวนที่เบิก
                            </label>
                            <ActivityInput
                              type="number"
                              value={
                                prod.quantity != null
                                  ? String(prod.quantity)
                                  : ""
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
                            <div className="sm:col-span-1 flex justify-end pt-4 sm:pt-0">
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
                      );
                    },
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Backward-compatible aliases
export const Type7aPlanForm = Type7aPlannedForm;
export const Type7NewDemo = Type7aPlannedForm;
export const EditType7aNewDemo = Type7aPlannedForm;
