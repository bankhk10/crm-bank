"use client";

import React from "react";
import { FormCombobox } from "@/components/custom/form-components";
import type { Type7DemoPlotItem } from "@/modules/activity-plans/features/form/types";
import { CROPS_BY_CATEGORY } from "@/modules/activity-plans/constants";

export interface CustomerOption {
  id: string;
  name: string;
  customerCode?: string | null;
  responsibleEmployeeId?: string | null;
}

export interface ProductOption {
  id: string;
  name: string;
  productCode?: string | null;
  price?: number | null;
  unit?: string | null;
}

interface Type7NewDemoProps {
  item: Type7DemoPlotItem;
  updateType7Row: (
    id: string,
    field: keyof Type7DemoPlotItem,
    val: any,
  ) => void;
  customerOptions: Array<{ value: string; label: string }>;
  productOptions: Array<{ value: string; label: string; subLabel?: string }>;
  cropCategoryOptions: Array<{ value: string; label: string }>;
  products?: ProductOption[];
  readonly?: boolean;
}

export function Type7NewDemo({
  item,
  updateType7Row,
  customerOptions,
  productOptions,
  cropCategoryOptions,
  products = [],
  readonly = false,
}: Type7NewDemoProps) {
  const availableCropOptions = (
    CROPS_BY_CATEGORY[item.cropCategory] || []
  ).map((crop: string) => ({
    value: crop,
    label: crop,
  }));

  const isRaiUnit = ["พืชไร่", "ผักและพืชล้มลุก"].includes(item.cropCategory);

  const isCustomCropName = [
    "ผักและพืชล้มลุกอื่นๆ",
    "พืชไร่อื่นๆ",
    "พืชสวนอื่นๆ",
  ].includes(item.cropName);

  const selectedProduct = products.find((p) => p.name === item.productName);
  const productUnitLabel = selectedProduct?.unit
    ? `(${selectedProduct.unit})`
    : "";

  return (
    <div className="space-y-3.5 pt-1">
      {/* Row 1: เจ้าของแปลง + สินค้าที่จะสาธิต + จำนวนสินค้าที่จะสาธิต */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-5">
          <FormCombobox
            id={`owner-combobox-${item.id}`}
            label="เจ้าของแปลง"
            labelClassName="block text-xs font-medium text-slate-700 mb-1 mx-0"
            triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
            value={item.ownerName}
            onChange={(val) => updateType7Row(item.id, "ownerName", val)}
            options={customerOptions}
            placeholder="เลือกเจ้าของแปลง..."
            searchPlaceholder="ค้นหาเจ้าของแปลง / ลูกค้า..."
            emptyText="ไม่พบเจ้าของแปลง"
            disabled={readonly}
            required
          />
        </div>

        <div className="md:col-span-4">
          <FormCombobox
            id={`product-combobox-${item.id}`}
            label="สินค้าที่จะสาธิต"
            labelClassName="block text-xs font-medium text-slate-700 mb-1 mx-0"
            triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
            value={item.productName}
            onChange={(val) => updateType7Row(item.id, "productName", val)}
            options={productOptions}
            placeholder="เลือกสินค้า..."
            searchPlaceholder="ค้นหาสินค้า..."
            emptyText="ไม่พบสินค้า"
            disabled={readonly}
            required
          />
        </div>

        <div className="md:col-span-3">
          <label className="block text-xs font-medium text-slate-700 mb-1">
            จำนวนสินค้าที่จะสาธิต {productUnitLabel}
          </label>
          <div className="relative flex items-center">
            <input
              type="number"
              min={0}
              value={
                item.plotsCount !== undefined && item.plotsCount !== null
                  ? item.plotsCount
                  : ""
              }
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  updateType7Row(item.id, "plotsCount", "" as any);
                } else {
                  const num = Math.max(0, parseInt(raw) || 0);
                  updateType7Row(item.id, "plotsCount", num);
                }
              }}
              disabled={readonly}
              placeholder="ระบุจำนวน..."
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Row 2: หมวดพืช + ชื่อพืช + (ระบุชื่อพืชเพิ่มเติม) + พื้นที่แปลง + จำนวนต้น */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div
          className={isCustomCropName ? "md:col-span-3" : "md:col-span-5"}
        >
          <FormCombobox
            id={`crop-category-combobox-${item.id}`}
            label="หมวดพืช"
            labelClassName="block text-xs font-medium text-slate-700 mb-1 mx-0"
            triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
            value={item.cropCategory}
            onChange={(newCat) => {
              updateType7Row(item.id, "cropCategory", newCat);
              const nextCrops = CROPS_BY_CATEGORY[newCat] || [];
              if (
                nextCrops.length > 0 &&
                !nextCrops.includes(item.cropName)
              ) {
                updateType7Row(item.id, "cropName", nextCrops[0]);
              }
            }}
            options={cropCategoryOptions}
            placeholder="เลือกหมวด..."
            searchPlaceholder="ค้นหาหมวดพืช..."
            emptyText="ไม่พบหมวดพืช"
            disabled={readonly}
          />
        </div>

        <div
          className={isCustomCropName ? "md:col-span-4" : "md:col-span-5"}
        >
          <FormCombobox
            id={`crop-name-combobox-${item.id}`}
            label="ชื่อพืช"
            labelClassName="block text-xs font-medium text-slate-700 mb-1 mx-0"
            triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500"
            value={item.cropName}
            onChange={(val) => {
              updateType7Row(item.id, "cropName", val);
              if (
                ![
                  "ผักและพืชล้มลุกอื่นๆ",
                  "พืชไร่อื่นๆ",
                  "พืชสวนอื่นๆ",
                ].includes(val)
              ) {
                updateType7Row(item.id, "customCropName", "");
              }
            }}
            options={availableCropOptions}
            placeholder="เลือกชื่อพืช..."
            searchPlaceholder="ค้นหาชื่อพืช..."
            emptyText="ไม่พบชื่อพืช"
            disabled={readonly || !item.cropCategory}
          />
        </div>

        {isCustomCropName && (
          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              ระบุชื่อพืชเพิ่มเติม <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={item.customCropName || ""}
              onChange={(e) =>
                updateType7Row(item.id, "customCropName", e.target.value)
              }
              disabled={readonly}
              placeholder="ระบุชื่อพืช..."
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
            />
          </div>
        )}

        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-slate-700 mb-1">
            {!item.cropCategory ? (
              <>
                จำนวน <span className="text-red-500">*</span>
              </>
            ) : isRaiUnit ? (
              <>
                พื้นที่ (ไร่) <span className="text-red-500">*</span>
              </>
            ) : (
              <>
                จำนวนต้น <span className="text-red-500">*</span>
              </>
            )}
          </label>
          <div className="relative flex items-center">
            <input
              type="number"
              min={1}
              value={
                isRaiUnit ? (item.areaRai ?? "") : (item.treeCount ?? "")
              }
              onChange={(e) => {
                const val = Math.max(0, parseInt(e.target.value) || 0);
                if (isRaiUnit) {
                  updateType7Row(item.id, "areaRai", val);
                } else {
                  updateType7Row(item.id, "treeCount", val);
                }
              }}
              disabled={readonly || !item.cropCategory}
              placeholder="0"
              className="w-full h-9 pl-3 pr-8 rounded-lg border border-slate-200 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white disabled:bg-slate-50"
            />
            <span className="absolute right-3 text-[11px] font-semibold text-slate-500 pointer-events-none">
              {!item.cropCategory ? "-" : isRaiUnit ? "ไร่" : "ต้น"}
            </span>
          </div>
        </div>
      </div>

      {/* Row 3: รายละเอียด / วิธีการทดลอง */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          รายละเอียด / วิธีการทดลอง
        </label>
        <textarea
          rows={2}
          value={item.experimentDetail || ""}
          onChange={(e) =>
            updateType7Row(item.id, "experimentDetail", e.target.value)
          }
          disabled={readonly}
          placeholder="ระบุรายละเอียดขั้นตอน สภาพแปลง หรือวิธีการทดลอง..."
          className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
        />
      </div>
    </div>
  );
}
