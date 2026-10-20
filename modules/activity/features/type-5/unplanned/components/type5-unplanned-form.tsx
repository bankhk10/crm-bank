"use client";

import React from "react";
import { BarChart2, Plus, Trash2, Sparkles, Store, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ActivityCustomerSelect,
  ActivityCombobox,
  ActivityInput,
  ActivityTextarea,
  ActivityPhotoUpload,
} from "@/modules/activity/ui";
import type { Type5UnplannedFormProps, Type5UnplannedItem } from "../types/unplanned.types";

export function Type5UnplannedForm({
  readonly = false,
  items,
  customers = [],
  products = [],
  addItem,
  updateItem,
  deleteItem,
}: Type5UnplannedFormProps) {
  const boxProducts = products.filter(
    (p) => !p.unit || p.unit.trim() === "กล่อง",
  );

  const productOptions = (
    boxProducts.length > 0 ? boxProducts : products || []
  ).map((p) => ({
    value: p.name,
    label: p.name,
    subLabel: p.productCode || undefined,
  }));

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
          <BarChart2 className="h-4 w-4 text-purple-600" />
          <span>สำรวจตลาดของคู่แข่ง (นอกแผน)</span>
        </div>

        {!readonly && addItem && (
          <Button
            type="button"
            size="sm"
            onClick={addItem}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg h-7 px-2.5 shadow-sm cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            เพิ่มรายการสำรวจ
          </Button>
        )}
      </div>

      {/* Items List */}
      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-4"
          >
            {/* Header of Item */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                รายการที่ {index + 1}
              </span>

              {!readonly && deleteItem && items.length > 1 && (
                <button
                  type="button"
                  onClick={() => deleteItem(item.id)}
                  className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>ลบรายการ</span>
                </button>
              )}
            </div>

            {/* Target Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ActivityCustomerSelect
                id={`customer-combobox-${item.id}`}
                type="STORE"
                label="ร้านค้า"
                labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-purple-500"
                value={item.storeId || item.storeName || ""}
                onChange={(val, cust) => {
                  updateItem(item.id, "storeName", cust?.name || val);
                  if (cust?.id) {
                    updateItem(item.id, "storeId", cust.id);
                  }
                }}
                customers={customers as any}
                placeholder="เลือกร้านค้า..."
                searchPlaceholder="ค้นหาร้านค้า..."
                emptyText="ไม่พบร้านค้า"
                disabled={readonly}
                required
              />

              <ActivityCombobox
                label="สินค้าที่นำไปเปรียบเทียบ"
                labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                triggerClassName="h-9 min-h-[36px] py-1 text-xs bg-white border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-purple-500"
                options={productOptions}
                value={item.comparedProduct}
                onChange={(val) => {
                  updateItem(item.id, "comparedProduct", val);
                  const foundP = products.find((p) => p.name === val);
                  if (foundP) {
                    updateItem(item.id, "productId", foundP.id);
                  }
                }}
                placeholder="เลือกสินค้าเปรียบเทียบ..."
                searchPlaceholder="ค้นหาสินค้าเปรียบเทียบ..."
                disabled={readonly}
                required
              />
            </div>

            {/* Competitor Brand & Product */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  แบรนด์คู่แข่งที่พบหน้างาน <span className="text-rose-500">*</span>
                </label>
                <ActivityInput
                  value={item.competitorBrand || ""}
                  onChange={(e) => updateItem(item.id, "competitorBrand", e.target.value)}
                  disabled={readonly}
                  placeholder="เช่น ตราเกษตรทองคำ, เสือคู่"
                  className="bg-white border-slate-200 h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  สินค้าคู่แข่ง <span className="text-rose-500">*</span>
                </label>
                <ActivityInput
                  value={item.competitorProduct || ""}
                  onChange={(e) => updateItem(item.id, "competitorProduct", e.target.value)}
                  disabled={readonly}
                  placeholder="เช่น ปุ๋ยสูตร 20-20-20"
                  className="bg-white border-slate-200 h-9 text-xs"
                  required
                />
              </div>
            </div>

            {/* Normalized 4-Tier Pricing */}
            <div className="bg-purple-50/30 border border-purple-100 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  ราคาขายแต่ละระดับ (บาท)
                </span>
                <span className="text-[11px] text-purple-700/70">กรอกข้อมูลราคาที่สำรวจได้</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">ราคา ณ จุดขาย (POS)</label>
                  <ActivityInput
                    type="number"
                    value={item.posPrice != null ? String(item.posPrice) : ""}
                    onChange={(e) =>
                      updateItem(
                        item.id,
                        "posPrice",
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    disabled={readonly}
                    placeholder="เช่น 450"
                    className="bg-white border-slate-200 h-9 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">ราคา Dealer</label>
                  <ActivityInput
                    type="number"
                    value={item.dealerPrice != null ? String(item.dealerPrice) : ""}
                    onChange={(e) =>
                      updateItem(
                        item.id,
                        "dealerPrice",
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    disabled={readonly}
                    placeholder="เช่น 380"
                    className="bg-white border-slate-200 h-9 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">ราคา Subdealer</label>
                  <ActivityInput
                    type="number"
                    value={item.subdealerPrice != null ? String(item.subdealerPrice) : ""}
                    onChange={(e) =>
                      updateItem(
                        item.id,
                        "subdealerPrice",
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    disabled={readonly}
                    placeholder="เช่น 410"
                    className="bg-white border-slate-200 h-9 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">ราคา Farmers</label>
                  <ActivityInput
                    type="number"
                    value={item.farmerPrice != null ? String(item.farmerPrice) : ""}
                    onChange={(e) =>
                      updateItem(
                        item.id,
                        "farmerPrice",
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    disabled={readonly}
                    placeholder="เช่น 450"
                    className="bg-white border-slate-200 h-9 text-xs font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Selling points */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                จุดขาย / จุดเด่นของสินค้า
              </label>
              <ActivityTextarea
                rows={2}
                value={item.sellingPoints || ""}
                onChange={(e) => updateItem(item.id, "sellingPoints", e.target.value)}
                disabled={readonly}
                placeholder="ระบุจุดขายหรือจุดเด่นของผลิตภัณฑ์คู่แข่ง เช่น ละลายน้ำไว ไม่ตกตะกอน บรรจุภัณฑ์จับถนัดมือ..."
                className="bg-white border-slate-200 text-xs min-h-[64px]"
              />
            </div>

            {/* Photos Upload */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
              <ActivityPhotoUpload
                key={`unplanned-bottle-${item.id}`}
                title="รูปถ่ายขวดผลิตภัณฑ์"
                description="รูปถ่ายขวดหรือบรรจุภัณฑ์ของสินค้าคู่แข่ง"
                images={item.bottleImages || []}
                onImagesChange={(imgs) => updateItem(item.id, "bottleImages", imgs)}
                maxFiles={2}
                accentColor="purple"
              />

              <ActivityPhotoUpload
                key={`unplanned-promo-${item.id}`}
                title="รูปภาพสื่อส่งเสริมการขาย"
                description="ป้ายโฆษณา, แบนเนอร์, โบรชัวร์ หรือสื่อโปรโมท"
                images={item.promotionalImages || []}
                onImagesChange={(imgs) => updateItem(item.id, "promotionalImages", imgs)}
                maxFiles={3}
                accentColor="blue"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
