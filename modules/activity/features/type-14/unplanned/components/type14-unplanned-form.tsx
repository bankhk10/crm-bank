"use client";

import React from "react";
import {
  Layers,
  MapPin,
  Package,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Activity,
  Sprout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ActivityCustomerSelect,
  ActivityAddressSelect,
  ActivityInput,
  ActivityGpsPicker,
  ActivityPhotoUpload,
  ActivityProductSelect,
} from "@/modules/activity/ui";
import {
  TRACKING_RESULT_OPTIONS,
  PRODUCT_RESPONSE_OPTIONS,
  TYPE14_MAX_IMAGES_PER_VILLAGE,
} from "../../shared/constants";
import type { Type14UnplannedFormProps } from "../types/unplanned.types";

export function Type14UnplannedForm({
  item,
  onChange,
  dealers = [],
  products = [],
  readonly = false,
  className = "",
}: Type14UnplannedFormProps) {
  const handleAddProduct = () => {
    if (readonly) return;
    const newProduct = {
      productId: "",
      productName: "",
      actualRate: "",
      quantityUsed: 1,
      unit: "ขวด",
      detail: "",
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

  const handleUpdateProduct = (pIdx: number, field: string, val: any) => {
    if (readonly) return;
    const prods = [...(item.products || [])];
    if (prods[pIdx]) {
      prods[pIdx] = { ...prods[pIdx], [field]: val };
      onChange({ ...item, products: prods });
    }
  };

  return (
    <div
      className={`bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-5 shadow-2xs ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
          <Layers className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-bold text-slate-800 text-sm sm:text-base">
            กิจกรรมนอกแผน: ติดตามแปลงแฮตแทค (TYPE_14)
          </h4>
          <p className="text-xs text-slate-500">
            ระบุข้อมูลแปลง ตัวแทนจำหน่าย พิกัด GPS และผลการติดตามการใช้สารแฮทแทค
          </p>
        </div>
      </div>

      {/* 1. Plot & Dealer Information */}
      <div className="space-y-3.5">
        <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
          <Sprout className="w-3.5 h-3.5 text-emerald-600" />
          1. ข้อมูลแปลงและตัวแทนจำหน่าย
        </h5>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-start">
          {/* Dealer */}
          <div>
            <ActivityCustomerSelect
              id="type14-unplanned-dealer"
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

          {/* Address */}
          <div className="md:col-span-2">
            <ActivityAddressSelect
              id="type14-unplanned-address"
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

        {/* Plot Name, Owner Name, Crop Name */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1 border-t border-slate-100">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              ชื่อแปลง <span className="text-rose-500">*</span>
            </label>
            <ActivityInput
              type="text"
              placeholder="ระบุชื่อแปลง เช่น แปลงลุงสมเกียรติ..."
              value={item.name || item.plotName || ""}
              onChange={(e) =>
                onChange({
                  ...item,
                  name: e.target.value,
                  plotName: e.target.value,
                })
              }
              disabled={readonly}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              ชื่อเจ้าของแปลง / เกษตรกร
            </label>
            <ActivityInput
              type="text"
              placeholder="ระบุชื่อเกษตรกรเจ้าของแปลง..."
              value={item.ownerName || ""}
              onChange={(e) => onChange({ ...item, ownerName: e.target.value })}
              disabled={readonly}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              ชนิดพืช
            </label>
            <ActivityInput
              type="text"
              placeholder="เช่น ทุเรียน, ข้าว, ข้าวโพด..."
              value={item.cropName || ""}
              onChange={(e) => onChange({ ...item, cropName: e.target.value })}
              disabled={readonly}
            />
          </div>
        </div>

        {/* GPS Coordinates */}
        <div className="pt-2">
          <ActivityGpsPicker
            latitude={item.latitude || ""}
            longitude={item.longitude || ""}
            onLocationChange={(lat: string, lng: string) =>
              onChange({ ...item, latitude: lat, longitude: lng })
            }
            disabled={readonly}
            required
          />
        </div>
      </div>

      {/* 2. Tracking Execution Details */}
      <div className="space-y-3.5 pt-3 border-t border-slate-200/80">
        <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-600" />
          2. ผลการตรวจติดตามแปลง
        </h5>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* วันที่ติดตามผล */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              วันที่ติดตามผล <span className="text-rose-500">*</span>
            </label>
            <ActivityInput
              type="date"
              value={item.actualVisitDate || ""}
              onChange={(e) =>
                onChange({ ...item, actualVisitDate: e.target.value })
              }
              disabled={readonly}
              required
            />
          </div>

          {/* ระยะเวลาหลังฉีดพ่น (วัน) */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              ระยะเวลาหลังฉีดพ่น (วัน)
            </label>
            <ActivityInput
              type="number"
              min={0}
              placeholder="เช่น 7, 14, 21"
              value={item.daysAfterSpray || ""}
              onChange={(e) =>
                onChange({ ...item, daysAfterSpray: e.target.value })
              }
              disabled={readonly}
            />
          </div>

          {/* ผลการติดตามแปลง */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              ผลการติดตามแปลง <span className="text-rose-500">*</span>
            </label>
            <select
              value={item.trackingResult || "ได้ผลตามเกณฑ์"}
              onChange={(e) =>
                onChange({ ...item, trackingResult: e.target.value })
              }
              disabled={readonly}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {TRACKING_RESULT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* การตอบสนองของพืช */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              การตอบสนองของพืช
            </label>
            <select
              value={item.productResponse || "ปกติ"}
              onChange={(e) =>
                onChange({ ...item, productResponse: e.target.value })
              }
              disabled={readonly}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {PRODUCT_RESPONSE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ข้อสังเกตเพิ่มเติม */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700">
            ข้อสังเกตเพิ่มเติม / ปัญหาที่พบ
          </label>
          <ActivityInput
            placeholder="ระบุข้อสังเกต สภาพพืช อาการ หรือแนวทางแก้ไข..."
            value={item.additionalNotes || ""}
            onChange={(e) =>
              onChange({ ...item, additionalNotes: e.target.value })
            }
            disabled={readonly}
          />
        </div>
      </div>

      {/* 3. Products Applied/Observed */}
      <div className="space-y-3 pt-3 border-t border-slate-200/80">
        <div className="flex items-center justify-between">
          <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-emerald-600" />
            3. รายการสินค้าที่ตรวจติดตาม ({item.products?.length || 0})
          </h5>
          {!readonly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddProduct}
              className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <Plus className="w-3 h-3 mr-1" />
              เพิ่มสินค้า
            </Button>
          )}
        </div>

        {item.products && item.products.length > 0 ? (
          <div className="space-y-2">
            {item.products.map((p, pIdx) => (
              <div
                key={pIdx}
                className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs"
              >
                <div className="col-span-12 sm:col-span-4">
                  <ActivityProductSelect
                    products={products as any}
                    value={p.productId}
                    onChange={(val, prod) => {
                      handleUpdateProduct(pIdx, "productId", val);
                      handleUpdateProduct(
                        pIdx,
                        "productName",
                        prod?.name || "",
                      );
                      if (prod?.unit) {
                        handleUpdateProduct(pIdx, "unit", prod.unit);
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
                      handleUpdateProduct(pIdx, "quantityUsed", e.target.value)
                    }
                    placeholder="จำนวน"
                    disabled={readonly}
                  />
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <ActivityInput
                    value={p.unit || "ขวด"}
                    onChange={(e) =>
                      handleUpdateProduct(pIdx, "unit", e.target.value)
                    }
                    placeholder="หน่วย"
                    disabled={readonly}
                  />
                </div>
                <div className="col-span-4 sm:col-span-3">
                  <ActivityInput
                    value={p.actualRate || ""}
                    onChange={(e) =>
                      handleUpdateProduct(pIdx, "actualRate", e.target.value)
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
                      onClick={() => handleRemoveProduct(pIdx)}
                      className="h-7 w-7 text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 text-center py-2 bg-slate-50/50 rounded-lg border border-dashed">
            ไม่มีรายการสินค้าเพิ่มเติม
          </div>
        )}
      </div>

      {/* 4. Photo Upload */}
      <div className="pt-3 border-t border-slate-200/80">
        <ActivityPhotoUpload
          title="รูปถ่ายการติดตามแปลง"
          description={`อัปโหลดภาพถ่ายสภาพพืชหลังฉีดพ่น หรืออาการผิดปกติ (สูงสุด ${TYPE14_MAX_IMAGES_PER_VILLAGE} รูป)`}
          images={item.images || []}
          onImagesChange={(images) => onChange({ ...item, images })}
          maxFiles={TYPE14_MAX_IMAGES_PER_VILLAGE}
          readonly={readonly}
          accentColor="emerald"
        />
      </div>
    </div>
  );
}
