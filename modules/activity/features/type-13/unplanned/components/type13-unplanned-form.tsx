"use client";

import React from "react";
import {
  Package,
  Plus,
  Trash2,
  Store,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ActivityCustomerSelect,
  ActivityAddressSelect,
  ActivityInput,
  ActivitySelect,
  ActivityPhotoUpload,
  ActivityProductSelect,
} from "@/modules/activity/ui";
import type { Type13UnplannedFormProps } from "../types/unplanned.types";
import type { Type13SprayingProduct } from "../../shared/types";

export function Type13UnplannedForm({
  item,
  onChange,
  dealers = [],
  products = [],
  readonly = false,
  className = "",
}: Type13UnplannedFormProps) {
  const handleAddProduct = () => {
    if (readonly) return;
    const newProduct: Type13SprayingProduct = {
      productId: "",
      productName: "",
      actualRate: "",
      quantityUsed: 1,
      actualQuantity: 1,
      extraQuantity: "",
      extraUnit: "ซีซี",
      unit: "ขวด",
    };
    onChange({
      ...item,
      products: [...(item.products || []), newProduct],
    });
  };

  const handleRemoveProduct = (pIdx: number) => {
    if (readonly) return;
    onChange({
      ...item,
      products: (item.products || []).filter((_, i) => i !== pIdx),
    });
  };

  const handleUpdateProduct = (
    pIdx: number,
    field: keyof Type13SprayingProduct,
    val: any,
  ) => {
    if (readonly) return;
    const prods = [...(item.products || [])];
    if (prods[pIdx]) {
      prods[pIdx] = { ...prods[pIdx], [field]: val };
      if (field === "actualQuantity") {
        prods[pIdx].quantityUsed = val;
      }
      onChange({ ...item, products: prods });
    }
  };

  return (
    <div
      className={`bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 space-y-6 shadow-2xs ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 font-bold text-sm shrink-0">
          13
        </div>
        <div>
          <h4 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
            <span>กิจกรรมนอกแผน: ฉีดแปลงแฮตแทค (TYPE_13)</span>
          </h4>
          <p className="text-xs text-slate-500">
            ระบุข้อมูลตัวแทนจำหน่าย ที่อยู่แปลง จำนวนแปลงที่ฉีดพ่นจริง ผลิตภัณฑ์ที่ใช้ และรูปภาพหลักฐาน
          </p>
        </div>
      </div>

      {/* 1. Dealer & Plot Location Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-emerald-600" />
          <h5 className="font-bold text-xs sm:text-sm text-slate-800">
            1. ข้อมูลตัวแทนจำหน่ายและพื้นที่แปลง
          </h5>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-start">
          {/* Dealer Select */}
          <div>
            <ActivityCustomerSelect
              id="type13-unplanned-dealer"
              type="STORE"
              label="ร้านค้า Dealer"
              value={item.storeId || ""}
              onChange={(val, cust) => {
                onChange({
                  ...item,
                  storeId: val,
                  dealerName: cust?.name || "",
                  province: cust?.province || item.province,
                  district: cust?.district || item.district,
                  subdistrict: cust?.subdistrict || item.subdistrict,
                });
              }}
              customers={dealers as any}
              placeholder="เลือกร้านค้า Dealer..."
              searchPlaceholder="ค้นหาร้านค้า..."
              emptyText="ไม่พบร้านค้า"
              disabled={readonly}
              required
            />
          </div>

          {/* Address Select */}
          <div className="md:col-span-2">
            <ActivityAddressSelect
              id="type13-unplanned-address"
              levels="province-district-subdistrict"
              provinceLabel="จังหวัด"
              districtLabel="อำเภอ"
              subdistrictLabel="ตำบล"
              value={{
                province: item.province || "",
                district: item.district || "",
                subdistrict: item.subdistrict || "",
              }}
              onChange={(val) => {
                onChange({
                  ...item,
                  province: val.province || "",
                  district: val.district || "",
                  subdistrict: val.subdistrict || "",
                });
              }}
              disabled={readonly}
              required
            />
          </div>
        </div>

        {/* Village & Actual Plots Count Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1 border-t border-slate-100">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              หมู่บ้าน
            </label>
            <ActivityInput
              type="text"
              placeholder="ระบุหมู่บ้าน เช่น บ้านหนองหว้า..."
              value={item.village || item.villageName || ""}
              onChange={(e) =>
                onChange({
                  ...item,
                  village: e.target.value,
                  villageName: e.target.value,
                })
              }
              disabled={readonly}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              จำนวนแปลงที่ฉีดพ่นจริง (แปลง) <span className="text-rose-500">*</span>
            </label>
            <ActivityInput
              type="number"
              min={1}
              placeholder="เช่น 3"
              value={
                item.actualPlotsCount !== undefined && item.actualPlotsCount !== null
                  ? String(item.actualPlotsCount)
                  : ""
              }
              onChange={(e) =>
                onChange({
                  ...item,
                  actualPlotsCount: e.target.value ? Number(e.target.value) : "",
                })
              }
              disabled={readonly}
              required
            />
          </div>
        </div>

        {/* วัตถุประสงค์ (ไม่บังคับกรอก) */}
        <div className="space-y-1 pt-1 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700">
            วัตถุประสงค์
          </label>
          <ActivityInput
            type="text"
            placeholder="ระบุวัตถุประสงค์ เช่น เพื่อทดสอบประสิทธิภาพสาร..."
            value={item.objective || ""}
            onChange={(e) =>
              onChange({
                ...item,
                objective: e.target.value,
              })
            }
            disabled={readonly}
          />
        </div>
      </div>

      {/* 2. Demo Products Used (สไตล์ Type 7B / Type 13 Actual) */}
      <div className="space-y-3.5 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-600" />
            <h5 className="font-bold text-xs sm:text-sm text-slate-800">
              2. ผลิตภัณฑ์ที่ใช้ / สินค้าสาธิต (Demo Products)
            </h5>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-100">
              {item.products?.length || 0} รายการ
            </span>
          </div>

          {!readonly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddProduct}
              className="h-8 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 px-2.5 rounded-xl shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>เพิ่มผลิตภัณฑ์</span>
            </Button>
          )}
        </div>

        {(!item.products || item.products.length === 0) ? (
          <div className="bg-slate-50/60 rounded-xl border border-dashed border-slate-200 p-4 text-center">
            <p className="text-xs text-slate-500">
              ยังไม่มีรายการผลิตภัณฑ์ที่ใช้ หากมีการใช้สารเคมีหรือผลิตภัณฑ์สาธิต
              สามารถกดปุ่ม <span className="font-semibold text-emerald-700">"เพิ่มผลิตภัณฑ์"</span> ได้ทันที
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {item.products.map((prod, pIdx) => (
              <div
                key={pIdx}
                className="bg-slate-50/70 rounded-xl border border-slate-200/80 p-3.5 sm:p-4 space-y-3 shadow-2xs"
              >
                {/* Header with Product Name / Index and Delete Button */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    รายการที่ {pIdx + 1}
                    {prod.productName ? `: ${prod.productName}` : ""}
                  </span>
                  {!readonly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveProduct(pIdx)}
                      className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ลบรายการนี้</span>
                    </Button>
                  )}
                </div>

                {/* Product Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    ผลิตภัณฑ์ <span className="text-rose-500">*</span>
                  </label>
                  <ActivityProductSelect
                    id={`type13-unplanned-prod-${pIdx}`}
                    value={prod.productId || ""}
                    valueKey="id"
                    onChange={(val, selectedProd) => {
                      handleUpdateProduct(pIdx, "productId", val);
                      if (selectedProd?.name) {
                        handleUpdateProduct(pIdx, "productName", selectedProd.name);
                      }
                      if (selectedProd?.unit) {
                        handleUpdateProduct(pIdx, "unit", selectedProd.unit);
                      }
                    }}
                    products={products as any}
                    placeholder="เลือกผลิตภัณฑ์แฮตแทค..."
                    disabled={readonly}
                  />
                </div>

                {/* 3 Detail Columns (สไตล์ Type 7B / Type 13 Actual) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* 1. จำนวนที่ใช้จริง (ขวด) */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      จำนวนที่ใช้จริง ({prod.unit || "ขวด"}){" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <ActivityInput
                      type="number"
                      min="0"
                      value={
                        prod.actualQuantity != null
                          ? String(prod.actualQuantity)
                          : prod.quantityUsed != null
                            ? String(prod.quantityUsed)
                            : ""
                      }
                      onChange={(e) =>
                        handleUpdateProduct(
                          pIdx,
                          "actualQuantity",
                          e.target.value ? Number(e.target.value) : "",
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
                          prod.extraQuantity != null ? String(prod.extraQuantity) : ""
                        }
                        onChange={(e) =>
                          handleUpdateProduct(pIdx, "extraQuantity", e.target.value)
                        }
                        disabled={readonly}
                        placeholder="เช่น 250"
                      />
                      <ActivitySelect
                        value={prod.extraUnit || "ซีซี"}
                        onChange={(val) => handleUpdateProduct(pIdx, "extraUnit", val)}
                        options={[
                          { value: "ซีซี", label: "ซีซี (ขวด)" },
                          { value: "กรัม", label: "กรัม (ซอง)" },
                          { value: "มล.", label: "มล." },
                          { value: "ลิตร", label: "ลิตร" },
                        ]}
                        disabled={readonly}
                      />
                    </div>
                  </div>

                  {/* 3. อัตราการใช้ */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      อัตราการใช้ <span className="text-rose-500">*</span>
                    </label>
                    <ActivityInput
                      value={prod.actualRate || ""}
                      onChange={(e) =>
                        handleUpdateProduct(pIdx, "actualRate", e.target.value)
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

      {/* 3. After-Spray Photos (ต่อหมู่บ้าน สูงสุด 20 ภาพ) */}
      <div className="pt-4 border-t border-slate-100">
        <ActivityPhotoUpload
          title="3. รูปหลังฉีดพ่น (ต่อหมู่บ้าน)"
          description="รองรับไฟล์รูปภาพ PNG, JPG หรือ WEBP (สูงสุด 20 รูปต่อหมู่บ้าน)"
          images={((item.images || item.afterSprayImages) as any) || []}
          onImagesChange={(imgs) => {
            onChange({
              ...item,
              images: imgs as any,
              afterSprayImages: imgs as any,
            });
          }}
          maxFiles={20}
          accentColor="emerald"
          disabled={readonly}
        />
      </div>

      {/* 4. Additional Notes */}
      <div className="space-y-1 pt-3 border-t border-slate-100">
        <label className="block text-xs font-semibold text-slate-700">
          4. บันทึกเพิ่มเติม (Notes)
        </label>
        <ActivityInput
          placeholder="ระบุหมายเหตุหรือข้อสังเกตเพิ่มเติม (ถ้ามี)..."
          value={item.notes || ""}
          onChange={(e) => onChange({ ...item, notes: e.target.value })}
          disabled={readonly}
        />
      </div>
    </div>
  );
}
