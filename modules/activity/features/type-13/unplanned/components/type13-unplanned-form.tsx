"use client";

import React from "react";
import {
  Layers,
  MapPin,
  Beaker,
  Package,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ActivityCustomerSelect,
  ActivityAddressSelect,
  ActivityInput,
  ActivityGpsPicker,
  ActivityPhotoUpload,
  ActivityProductSelect,
} from "@/modules/activity/ui";
import {
  SPRAY_EQUIPMENT_OPTIONS,
  PRODUCT_RESPONSE_OPTIONS,
} from "../../shared/constants";
import type { Type13UnplannedFormProps } from "../types/unplanned.types";

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
    const newProduct = {
      productId: "",
      productName: "",
      actualRate: "",
      quantityUsed: 1,
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
            กิจกรรมนอกแผน: ฉีดแปลงแฮตแทค (TYPE_13)
          </h4>
          <p className="text-xs text-slate-500">
            ระบุข้อมูลแปลง ตัวแทนจำหน่าย พิกัด GPS และผลการฉีดพ่น
          </p>
        </div>
      </div>

      {/* 1. Plot Information */}
      <div className="space-y-3.5">
        <h5 className="font-bold text-xs text-slate-800">1. ข้อมูลแปลงและตัวแทนจำหน่าย</h5>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-start">
          {/* Dealer */}
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

        {/* Plot Name, Village, Count */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1 border-t border-slate-100">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              ชื่อแปลง <span className="text-rose-500">*</span>
            </label>
            <ActivityInput
              type="text"
              placeholder="ระบุชื่อแปลง เช่น แปลงพี่สมชาย..."
              value={item.name || ""}
              onChange={(e) => onChange({ ...item, name: e.target.value })}
              disabled={readonly}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              หมู่บ้าน
            </label>
            <ActivityInput
              type="text"
              placeholder="ระบุหมู่บ้าน เช่น บ้านหนองหว้า..."
              value={item.village || ""}
              onChange={(e) => onChange({ ...item, village: e.target.value })}
              disabled={readonly}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              จำนวนแปลงที่ฉีดจริง (แปลง)
            </label>
            <ActivityInput
              type="number"
              min={1}
              placeholder="เช่น 3"
              value={item.actualPlotsCount !== undefined ? String(item.actualPlotsCount) : ""}
              onChange={(e) =>
                onChange({
                  ...item,
                  actualPlotsCount: e.target.value ? Number(e.target.value) : "",
                })
              }
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

      {/* 2. Spraying Execution Details */}
      <div className="space-y-3.5 pt-3 border-t border-slate-200/80">
        <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
          <Beaker className="w-3.5 h-3.5 text-emerald-600" />
          2. ผลการฉีดพ่น
        </h5>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* วิธีการฉีดพ่น */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              วิธีการฉีดพ่น
            </label>
            <Select
              value={item.sprayMethod || "SINGLE"}
              onValueChange={(val: any) => onChange({ ...item, sprayMethod: val })}
              disabled={readonly}
            >
              <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SINGLE">เดี่ยว (Single)</SelectItem>
                <SelectItem value="TANK_MIXED">ผสมถัง (Tank-Mixed)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* อุปกรณ์ที่ใช้ */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              อุปกรณ์ที่ใช้
            </label>
            <Select
              value={item.sprayEquipment || "เครื่องยนต์พ่นยา"}
              onValueChange={(val) => onChange({ ...item, sprayEquipment: val })}
              disabled={readonly}
            >
              <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPRAY_EQUIPMENT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ผลหลังการฉีดพ่น */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              ผลหลังการฉีดพ่น
            </label>
            <Select
              value={item.productResponse || "ปกติ"}
              onValueChange={(val) => onChange({ ...item, productResponse: val })}
              disabled={readonly}
            >
              <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_RESPONSE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Used */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-emerald-600" />
              ผลิตภัณฑ์ที่ใช้ ({item.products?.length || 0})
            </span>
            {!readonly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddProduct}
                className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 px-2"
              >
                <Plus className="w-3 h-3 mr-1" />
                <span>เพิ่มผลิตภัณฑ์</span>
              </Button>
            )}
          </div>

          {item.products && item.products.length > 0 && (
            <div className="space-y-2">
              {item.products.map((prod, pIdx) => (
                <div
                  key={pIdx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-slate-50/70 p-2.5 rounded-lg border border-slate-200/60 text-xs"
                >
                  <div className="sm:col-span-5">
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
                      placeholder="เลือกผลิตภัณฑ์..."
                      disabled={readonly}
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Input
                      type="text"
                      placeholder="อัตราใช้ (เช่น 20 ซีซี/20 ลิตร)"
                      value={prod.actualRate || ""}
                      onChange={(e) =>
                        handleUpdateProduct(pIdx, "actualRate", e.target.value)
                      }
                      disabled={readonly}
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                  <div className="sm:col-span-3 flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={0}
                      placeholder="จำนวน"
                      value={prod.quantityUsed ?? ""}
                      onChange={(e) =>
                        handleUpdateProduct(pIdx, "quantityUsed", e.target.value)
                      }
                      disabled={readonly}
                      className="h-8 text-xs bg-white w-20"
                    />
                    <span className="text-slate-500 text-[11px] truncate">
                      {prod.unit || "ขวด"}
                    </span>
                  </div>
                  {!readonly && (
                    <div className="sm:col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(pIdx)}
                        className="p-1 text-slate-400 hover:text-red-500 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. After-Spray Photos */}
      <div className="space-y-2 pt-3 border-t border-slate-200/80">
        <h5 className="font-bold text-xs text-slate-800">
          3. รูปภาพหลังฉีดพ่น (สูงสุด 20 รูป)
        </h5>
        <ActivityPhotoUpload
          images={item.images || []}
          onImagesChange={(imgs) => onChange({ ...item, images: imgs as any })}
          maxFiles={20}
          disabled={readonly}
        />
      </div>
    </div>
  );
}
