"use client";

import React, { useMemo } from "react";
import {
  User,
  MapPin,
  Sprout,
  Droplets,
  Calendar,
  Wrench,
  Package,
  PackagePlus,
  Plus,
  Trash2,
  Camera,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ActivityInput,
  ActivityTextarea,
  ActivityCombobox,
  ActivityCustomerSelect,
  ActivityProductSelect,
  ActivityPhotoUpload,
  ActivityGpsPicker,
  ActivityAddressSelect,
  ActivityIrrigationCheckbox,
  ActivityDatePicker,
  ActivitySelect,
} from "@/modules/activity/ui";
import type {
  Type7aActualFormProps,
  Type7aPlannedProductActualItem,
  Type7aAdditionalProductItem,
  Type7aExternalChemicalItem,
} from "../types/actual.types";
import { Type7aPlanCard } from "./type7a-plan-card";

export const SPRAY_EQUIPMENT_OPTIONS = [
  "เครื่องพ่นสะพายหลัง (เครื่องยนต์ / แบตเตอรี่)",
  "เครื่องพ่นปั๊มลากสาย",
  "โดรนเพื่อการเกษตร",
  "แอร์บัส / รถพ่นยา",
  "อื่นๆ (ระบุ)",
] as const;

export const EXTERNAL_FORMULA_OPTIONS = [
  { value: "SL", label: "SL (Soluble Liquid)" },
  { value: "SC", label: "SC (Suspension Concentrate)" },
  { value: "EC", label: "EC (Emulsifiable Concentrate)" },
  { value: "อื่นๆ", label: "อื่นๆ (ระบุ)" },
];

export function Type7aActualForm({
  isVisible = true,
  planType,
  target,
  targets = [],
  customers = [],
  products = [],
  actualState = {},
  onUpdateField,
  onUpdatePlannedProduct,
  onAddAdditionalProduct,
  onUpdateAdditionalProduct,
  onRemoveAdditionalProduct,
  onAddExternalProduct,
  onUpdateExternalProduct,
  onRemoveExternalProduct,
  readonly = false,
}: Type7aActualFormProps) {
  if (!isVisible) return null;

  const resolvedTargets = targets.length > 0 ? targets : target ? [target] : [];

  // -------------------------------------------------------------
  // Filter Farmers by Province
  // -------------------------------------------------------------
  const farmerCustomers = useMemo(() => {
    return customers.filter(
      (c) => c.customerType === "FARMER" || !c.customerType,
    );
  }, [customers]);

  const provinceOptions = useMemo(() => {
    const provinces = new Set<string>();
    farmerCustomers.forEach((c) => {
      if (c.province && c.province.trim()) {
        provinces.add(c.province.trim());
      }
    });
    return Array.from(provinces)
      .sort((a, b) => a.localeCompare(b, "th"))
      .map((p) => ({ value: p, label: p }));
  }, [farmerCustomers]);

  const filteredFarmers = useMemo(() => {
    const selProvince = actualState.t7SelectedProvince || actualState.t7FarmerProvince;
    if (!selProvince) return farmerCustomers;
    return farmerCustomers.filter((c) => c.province === selProvince);
  }, [farmerCustomers, actualState.t7SelectedProvince, actualState.t7FarmerProvince]);

  // Planned Products
  const plannedProductsList: Type7aPlannedProductActualItem[] = useMemo(() => {
    if (
      Array.isArray(actualState.t7PlannedProducts) &&
      actualState.t7PlannedProducts.length > 0
    ) {
      return actualState.t7PlannedProducts;
    }
    // Fallback extract from targets if hook state not initialized yet
    const targetProds = resolvedTargets[0]?.products || (resolvedTargets[0] as any)?.demoProducts || [];
    return targetProds.map((p: any) => ({
      productId: p.productId || p.product?.id || p.id || "",
      productName: p.productName || p.product?.name || p.name || "",
      withdrawnQuantity: Number(p.withdrawnQuantity ?? p.quantity ?? p.targetQuantity ?? 1) || 1,
      actualQuantity: Number(p.quantity ?? p.targetQuantity ?? p.withdrawnQuantity ?? 1) || 1,
      extraQuantity: p.extraQuantity != null ? String(p.extraQuantity) : "",
      extraUnit: p.extraUnit || (p.product?.unit?.includes("ซอง") || p.unit?.includes("ซอง") ? "กรัม" : "ซีซี"),
      applicationRate: p.applicationRate || "",
    }));
  }, [actualState.t7PlannedProducts, resolvedTargets]);

  const additionalProductsList: Type7aAdditionalProductItem[] =
    actualState.t7AdditionalProducts || [];

  const externalProductsList: Type7aExternalChemicalItem[] =
    actualState.t7ExternalProducts || [];

  // -------------------------------------------------------------
  // Handlers for Items
  // -------------------------------------------------------------
  const handleUpdatePlannedProd = (
    index: number,
    field: keyof Type7aPlannedProductActualItem,
    val: any,
  ) => {
    if (onUpdatePlannedProduct) {
      onUpdatePlannedProduct(index, field, val);
    } else {
      const updated = [...plannedProductsList];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: val };
        onUpdateField?.("t7PlannedProducts", updated);
      }
    }
  };

  const handleAddAdditionalProd = () => {
    if (onAddAdditionalProduct) {
      onAddAdditionalProduct();
    } else {
      const updated = [
        ...additionalProductsList,
        {
          id: `add-${Date.now()}-${additionalProductsList.length}`,
          productId: "",
          productName: "",
          actualQuantity: 1,
          extraQuantity: "",
          extraUnit: "ซีซี",
          applicationRate: "",
        },
      ];
      onUpdateField?.("t7AdditionalProducts", updated);
    }
  };

  const handleUpdateAdditionalProd = (
    index: number,
    field: keyof Type7aAdditionalProductItem,
    val: any,
  ) => {
    if (onUpdateAdditionalProduct) {
      onUpdateAdditionalProduct(index, field, val);
    } else {
      const updated = [...additionalProductsList];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: val };
        onUpdateField?.("t7AdditionalProducts", updated);
      }
    }
  };

  const handleRemoveAdditionalProd = (index: number) => {
    if (onRemoveAdditionalProduct) {
      onRemoveAdditionalProduct(index);
    } else {
      const updated = additionalProductsList.filter((_, i) => i !== index);
      onUpdateField?.("t7AdditionalProducts", updated);
    }
  };

  const handleAddExtProd = () => {
    if (onAddExternalProduct) {
      onAddExternalProduct();
    } else {
      const updated = [
        ...externalProductsList,
        {
          id: `ext-${Date.now()}-${externalProductsList.length}`,
          company: "",
          productName: "",
          activeIngredient: "",
          formula: "SL",
          customFormula: "",
          applicationRate: "",
        },
      ];
      onUpdateField?.("t7ExternalProducts", updated);
    }
  };

  const handleUpdateExtProd = (
    index: number,
    field: keyof Type7aExternalChemicalItem,
    val: any,
  ) => {
    if (onUpdateExternalProduct) {
      onUpdateExternalProduct(index, field, val);
    } else {
      const updated = [...externalProductsList];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: val };
        onUpdateField?.("t7ExternalProducts", updated);
      }
    }
  };

  const handleRemoveExtProd = (index: number) => {
    if (onRemoveExternalProduct) {
      onRemoveExternalProduct(index);
    } else {
      const updated = externalProductsList.filter((_, i) => i !== index);
      onUpdateField?.("t7ExternalProducts", updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Plan Reference Summary Card */}
      {planType !== "UNPLANNED" && resolvedTargets.length > 0 && (
        <Type7aPlanCard targets={resolvedTargets as any} />
      )}

      {/* Main Actual Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-7">
        {/* Form Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              บันทึกผลการจัดทำแปลงสาธิตจริง (Type 7A Actual)
            </h3>
            <p className="text-xs text-slate-500">
              กรอกข้อมูลเกษตรกรเจ้าของแปลง, สภาพแปลงเริ่มต้น, การใช้สารเคมี และรูปถ่ายแปลงสาธิต
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1: เกษตรกรเจ้าของแปลงและพิกัดแปลง (Farmer Owner & Coordinates)     */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <User className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-800">
              1. เกษตรกรเจ้าของแปลงและพิกัดแปลง (Farmer Owner & Coordinates)
            </h4>
          </div>

          <div className="bg-slate-50/70 border border-slate-150 rounded-xl p-3.5 sm:p-4 space-y-4">
            {/* Checkbox: เกษตรกรไม่มีในระบบ */}
            <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-slate-200/60">
              <label className="text-xs font-semibold text-slate-700">
                สถานะเกษตรกรในระบบ
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={Boolean(actualState.t7IsUnregisteredFarmer)}
                  onChange={(e) => {
                    const isUnregistered = e.target.checked;
                    onUpdateField?.("t7IsUnregisteredFarmer", isUnregistered);
                    if (isUnregistered) {
                      onUpdateField?.("t7FarmerCustomerId", null);
                    }
                  }}
                  disabled={readonly}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-700">
                  เกษตรกรไม่มีในระบบ
                </span>
              </label>
            </div>

            {/* โหมด 1: เกษตรกรในระบบ */}
            {!actualState.t7IsUnregisteredFarmer ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <ActivityAddressSelect
                  levels="province"
                  label="เลือกจังหวัด (เพื่อกรองเกษตรกร)"
                  labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                  value={actualState.t7SelectedProvince || actualState.t7FarmerProvince || ""}
                  onChange={(val: any) => {
                    const prov = typeof val === "string" ? val : val?.province || "";
                    onUpdateField?.("t7SelectedProvince", prov);
                    onUpdateField?.("t7FarmerProvince", prov);
                    // Reset farmer selection when changing province
                    if (actualState.t7FarmerCustomerId) {
                      onUpdateField?.("t7FarmerCustomerId", null);
                      onUpdateField?.("t7FarmerName", "");
                    }
                  }}
                  provincePlaceholder="เลือกจังหวัด..."
                  placeholder="เลือกจังหวัด..."
                  disabled={readonly}
                />

                <ActivityCustomerSelect
                  id="actual-t7-farmer-combobox"
                  type="FARMER"
                  province={actualState.t7SelectedProvince || actualState.t7FarmerProvince || ""}
                  customers={customers}
                  label="เกษตรกรเจ้าของแปลง"
                  labelClassName="block text-xs font-semibold text-slate-700 mb-1 mx-0"
                  value={actualState.t7FarmerCustomerId || actualState.t7FarmerName || ""}
                  onChange={(val, cust) => {
                    onUpdateField?.("t7FarmerName", cust?.name || val);
                    if (cust?.id) {
                      onUpdateField?.("t7FarmerCustomerId", cust.id);
                      if (cust.province) onUpdateField?.("t7FarmerProvince", cust.province);
                      if (cust.district) onUpdateField?.("t7FarmerDistrict", cust.district);
                      if (cust.phone || (cust as any).telephone) {
                        onUpdateField?.("t7FarmerPhone", cust.phone || (cust as any).telephone);
                      }
                    } else {
                      onUpdateField?.("t7FarmerCustomerId", null);
                    }
                  }}
                  placeholder={
                    actualState.t7SelectedProvince || actualState.t7FarmerProvince
                      ? "เลือกเกษตรกรจากรายชื่อ..."
                      : "กรุณาเลือกจังหวัดก่อน"
                  }
                  searchPlaceholder="พิมพ์ชื่อค้นหาเกษตรกร..."
                  emptyText="ไม่พบรายชื่อเกษตรกรในจังหวัดนี้"
                  disabled={readonly}
                  required
                />
              </div>
            ) : (
              /* โหมด 2: เกษตรกรไม่มีในระบบ (กรอกข้อมูลอิสระ) */
              <div className="space-y-3.5 bg-white border border-emerald-200/80 rounded-xl p-3 sm:p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      ชื่อ - สกุล เกษตรกร <span className="text-rose-500">*</span>
                    </label>
                    <ActivityInput
                      value={actualState.t7FarmerName || ""}
                      onChange={(e) => onUpdateField?.("t7FarmerName", e.target.value)}
                      disabled={readonly}
                      placeholder="ระบุชื่อ - สกุล เกษตรกร..."
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      เบอร์โทรศัพท์ <span className="text-rose-500">*</span>
                    </label>
                    <ActivityInput
                      type="tel"
                      value={actualState.t7FarmerPhone || ""}
                      onChange={(e) => onUpdateField?.("t7FarmerPhone", e.target.value)}
                      disabled={readonly}
                      placeholder="เช่น 081-234-5678"
                      required
                    />
                  </div>
                </div>

                {/* ที่อยู่: จังหวัด อำเภอ ตำบล */}
                <div className="pt-1">
                  <ActivityAddressSelect
                    levels="province-district-subdistrict"
                    value={{
                      province: actualState.t7FarmerProvince || "",
                      district: actualState.t7FarmerDistrict || "",
                      subdistrict: actualState.t7FarmerSubdistrict || "",
                    }}
                    onChange={(addr) => {
                      if (addr) {
                        onUpdateField?.("t7FarmerProvince", addr.province || "");
                        onUpdateField?.("t7FarmerDistrict", addr.district || "");
                        onUpdateField?.("t7FarmerSubdistrict", addr.subdistrict || "");
                      }
                    }}
                    provinceLabel="จังหวัด"
                    districtLabel="อำเภอ"
                    subdistrictLabel="ตำบล"
                    disabled={readonly}
                    required
                  />
                </div>
              </div>
            )}

            {/* 3. พิกัดแปลงสาธิต (GPS) */}
            <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                พิกัดแปลงสาธิตหน้างาน (GPS) <span className="text-rose-500">*</span>
              </label>
              <ActivityGpsPicker
                latitude={actualState.t7Latitude != null ? String(actualState.t7Latitude) : undefined}
                longitude={actualState.t7Longitude != null ? String(actualState.t7Longitude) : undefined}
                onLocationChange={(lat: string, lng: string) => {
                  onUpdateField?.("t7Latitude", lat ? Number(lat) : undefined);
                  onUpdateField?.("t7Longitude", lng ? Number(lng) : undefined);
                }}
                readonly={readonly}
              />
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: ข้อมูลสภาพแปลงเริ่มต้น (Initial Plot Condition & Observations) */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-800">
              2. ข้อมูลสภาพแปลงเริ่มต้น (Initial Plot Condition & Observations)
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 4.1 ข้อมูลพืชประธาน */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700">
                ข้อมูลพืชประธาน <span className="text-rose-500">*</span>
              </label>
              <ActivityInput
                value={actualState.t7MainCropInfo || actualState.t7CropName || ""}
                onChange={(e) => onUpdateField?.("t7MainCropInfo", e.target.value)}
                disabled={readonly}
                placeholder="เช่น ข้าวหอมมะลิ 105, ทุเรียนหมอนทอง อายุ 4 ปี..."
                required
              />
            </div>

            {/* 4.2 วิธีการทดลอง */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700">
                วิธีการทดลอง <span className="text-rose-500">*</span>
              </label>
              <ActivityTextarea
                rows={2}
                value={actualState.t7ExperimentDetail || ""}
                onChange={(e) => onUpdateField?.("t7ExperimentDetail", e.target.value)}
                disabled={readonly}
                placeholder="ระบุวิธีการทดลอง การเปรียบเทียบ หรือแนวทางการทดสอบ..."
                required
              />
            </div>

            {/* 4.3 ระบบน้ำ (เลือกได้มากกว่า 1 ข้อ) */}
            <div className="sm:col-span-2 pt-1">
              <ActivityIrrigationCheckbox
                value={actualState.t7Irrigations || []}
                onChange={(vals) => onUpdateField?.("t7Irrigations", vals)}
                disabled={readonly}
                readonly={readonly}
              />
            </div>

            {/* 4.4 วันที่เริ่มปลูกจริง */}
            <ActivityDatePicker
              label="วันที่เริ่มปลูกจริง"
              value={actualState.t7PlantingDate || ""}
              onChange={(val) => onUpdateField?.("t7PlantingDate", val)}
              disabled={readonly}
            />

            {/* 4.5 วันที่ฉีดพ่นครั้งแรก */}
            <ActivityDatePicker
              label="วันที่ฉีดพ่นครั้งแรก"
              value={actualState.t7InitialSprayDate || ""}
              onChange={(val) => onUpdateField?.("t7InitialSprayDate", val)}
              disabled={readonly}
            />

            {/* 4.6 กำหนดฉีดพ่นครั้งต่อไป */}
            <ActivityDatePicker
              label="กำหนดฉีดพ่นครั้งต่อไป"
              value={actualState.t7NextSprayDate || ""}
              onChange={(val) => onUpdateField?.("t7NextSprayDate", val)}
              disabled={readonly}
            />

            {/* 4.7 อายุพืช (วันหลังปลูก) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                อายุพืช (วันหลังปลูก)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <ActivityInput
                  type="number"
                  value={actualState.t7CropAgeValue != null ? String(actualState.t7CropAgeValue) : ""}
                  onChange={(e) => onUpdateField?.("t7CropAgeValue", e.target.value)}
                  disabled={readonly}
                  placeholder="เช่น 15"
                />
                <ActivitySelect
                  value={actualState.t7CropAgeUnit || "วัน"}
                  onChange={(val) => onUpdateField?.("t7CropAgeUnit", val)}
                  options={[
                    { value: "วัน", label: "วัน" },
                    { value: "เดือน", label: "เดือน" },
                  ]}
                  disabled={readonly}
                />
              </div>
            </div>

            {/* 4.8 ระยะการเจริญเติบโต */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                ระยะการเจริญเติบโต
              </label>
              <ActivityInput
                value={actualState.t7GrowthStage || ""}
                onChange={(e) => onUpdateField?.("t7GrowthStage", e.target.value)}
                disabled={readonly}
                placeholder="เช่น ระยะแตกกอ, ระยะติดผลอ่อน..."
              />
            </div>

            {/* 4.9 ข้อมูลเพิ่มเติม */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700">
                ข้อมูลเพิ่มเติม
              </label>
              <ActivityTextarea
                rows={2}
                value={actualState.t7Notes || ""}
                onChange={(e) => onUpdateField?.("t7Notes", e.target.value)}
                disabled={readonly}
                placeholder="บันทึกข้อสังเกตเพิ่มเติมเกี่ยวกับสภาพดิน สภาพอากาศ หรือคำแนะนำ..."
              />
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: วิธีการฉีดพ่นและยาภายนอก (Spraying & External Chemicals)        */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Droplets className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-800">
              3. วิธีการฉีดพ่นและยาภายนอก (Spraying & External Chemicals)
            </h4>
          </div>

          <div className="bg-slate-50/70 border border-slate-150 rounded-xl p-3.5 sm:p-4 space-y-4">
            {/* 4.10 วิธีการฉีดพ่น (Single vs Tank-mixed) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                วิธีการฉีดพ่น <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <button
                  type="button"
                  disabled={readonly}
                  onClick={() => onUpdateField?.("t7SprayMethod", "SINGLE")}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    actualState.t7SprayMethod !== "TANK_MIXED"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  ฉีดเดี่ยว (Single)
                </button>
                <button
                  type="button"
                  disabled={readonly}
                  onClick={() => onUpdateField?.("t7SprayMethod", "TANK_MIXED")}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    actualState.t7SprayMethod === "TANK_MIXED"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  ผสมถัง (Tank-mixed)
                </button>
              </div>
            </div>

            {/* Checkbox มียาภายนอก (แสดงเฉพาะเมื่อเลือก Tank-mixed) */}
            {actualState.t7SprayMethod === "TANK_MIXED" && (
              <div className="pt-2 border-t border-slate-200/60 space-y-3">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(actualState.t7HasExternalChemicals)}
                    onChange={(e) => onUpdateField?.("t7HasExternalChemicals", e.target.checked)}
                    disabled={readonly}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-medium text-slate-800">
                    มียาภายนอก (ไม่บังคับ)
                  </span>
                </label>

                {/* 4.11 ฟอร์มกรอกยาภายนอก */}
                {actualState.t7HasExternalChemicals && (
                  <div className="space-y-3 bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-slate-800">
                        รายการยาภายนอกที่ใช้ร่วม
                      </h5>
                      {!readonly && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddExtProd}
                          className="h-7 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          เพิ่มยาภายนอก
                        </Button>
                      )}
                    </div>

                    {externalProductsList.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2 text-center bg-slate-50 rounded-lg">
                        ยังไม่มีรายการยาภายนอก กดปุ่ม &quot;+ เพิ่มยาภายนอก&quot; เพื่อระบุ
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {externalProductsList.map((ext, idx) => (
                          <div
                            key={ext.id || idx}
                            className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-emerald-800">
                                ยาภายนอกลำดับที่ {idx + 1}
                              </span>
                              {!readonly && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveExtProd(idx)}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                                  title="ลบรายการ"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                              <div className="space-y-1">
                                <label className="text-[11px] font-medium text-slate-600">
                                  บริษัท
                                </label>
                                <ActivityInput
                                  value={ext.company || ""}
                                  onChange={(e) =>
                                    handleUpdateExtProd(idx, "company", e.target.value)
                                  }
                                  disabled={readonly}
                                  placeholder="ระบุบริษัท..."
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] font-medium text-slate-600">
                                  ชื่อสินค้า <span className="text-rose-500">*</span>
                                </label>
                                <ActivityInput
                                  value={ext.productName || ""}
                                  onChange={(e) =>
                                    handleUpdateExtProd(idx, "productName", e.target.value)
                                  }
                                  disabled={readonly}
                                  placeholder="ระบุชื่อสินค้า..."
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] font-medium text-slate-600">
                                  สารออกฤทธิ์
                                </label>
                                <ActivityInput
                                  value={ext.activeIngredient || ""}
                                  onChange={(e) =>
                                    handleUpdateExtProd(idx, "activeIngredient", e.target.value)
                                  }
                                  disabled={readonly}
                                  placeholder="ระบุสารออกฤทธิ์..."
                                />
                              </div>

                              <div className="space-y-1">
                                <ActivitySelect
                                  label="สูตร"
                                  labelClassName="text-[11px] font-medium text-slate-600 mb-0"
                                  value={ext.formula || "SL"}
                                  onChange={(val) =>
                                    handleUpdateExtProd(idx, "formula", val)
                                  }
                                  options={EXTERNAL_FORMULA_OPTIONS}
                                  disabled={readonly}
                                />
                              </div>

                              {ext.formula === "อื่นๆ" && (
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-slate-600">
                                    ระบุสูตรเพิ่มเติม <span className="text-rose-500">*</span>
                                  </label>
                                  <ActivityInput
                                    value={ext.customFormula || ""}
                                    onChange={(e) =>
                                      handleUpdateExtProd(idx, "customFormula", e.target.value)
                                    }
                                    disabled={readonly}
                                    placeholder="ระบุสูตร..."
                                  />
                                </div>
                              )}

                              <div className="space-y-1">
                                <label className="text-[11px] font-medium text-slate-600">
                                  อัตราการใช้ <span className="text-rose-500">*</span>
                                </label>
                                <ActivityInput
                                  value={ext.applicationRate || ""}
                                  onChange={(e) =>
                                    handleUpdateExtProd(idx, "applicationRate", e.target.value)
                                  }
                                  disabled={readonly}
                                  placeholder="เช่น 20 ซีซี / น้ำ 20 ลิตร"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 4: อุปกรณ์ที่ใช้ฉีดพ่น (Spray Equipment)                            */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Wrench className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-800">
              4. อุปกรณ์ที่ใช้ฉีดพ่น (Spray Equipment)
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <ActivitySelect
              label="เลือกอุปกรณ์ที่ใช้ฉีดพ่น"
              value={actualState.t7SprayEquipment || "เครื่องพ่นสะพายหลัง (เครื่องยนต์ / แบตเตอรี่)"}
              onChange={(val) => onUpdateField?.("t7SprayEquipment", val)}
              options={SPRAY_EQUIPMENT_OPTIONS.map((equip) => ({ value: equip, label: equip }))}
              disabled={readonly}
            />

            {actualState.t7SprayEquipment === "อื่นๆ (ระบุ)" && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  ระบุอุปกรณ์เพิ่มเติม <span className="text-rose-500">*</span>
                </label>
                <ActivityInput
                  value={actualState.t7OtherEquipment || ""}
                  onChange={(e) => onUpdateField?.("t7OtherEquipment", e.target.value)}
                  disabled={readonly}
                  placeholder="พิมพ์ระบุอุปกรณ์ฉีดพ่น..."
                />
              </div>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 5: สินค้าที่เบิกตามแผน (Planned Demo Products)                     */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Package className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-800">
              5. สินค้าที่เบิกตามแผน (Planned Demo Products)
            </h4>
          </div>

          {plannedProductsList.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2 text-center bg-slate-50 rounded-xl">
              ไม่มีรายการสินค้าตัวอย่างที่ขอเบิกไว้ในแผนงาน
            </p>
          ) : (
            <div className="space-y-3">
              {plannedProductsList.map((prod, idx) => (
                <div
                  key={prod.productId || idx}
                  className="bg-emerald-50/40 border border-emerald-150 rounded-xl p-3.5 sm:p-4 space-y-3"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {idx + 1}. {prod.productName || "สินค้าตัวอย่าง"}
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-md">
                      จำนวนที่เบิก: {prod.withdrawnQuantity}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        จำนวนที่ใช้จริง (ขวด) <span className="text-rose-500">*</span>
                      </label>
                      <ActivityInput
                        type="number"
                        min="0"
                        value={prod.actualQuantity != null ? String(prod.actualQuantity) : ""}
                        onChange={(e) =>
                          handleUpdatePlannedProd(idx, "actualQuantity", e.target.value)
                        }
                        disabled={readonly}
                        placeholder="เช่น 1"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        ปริมาณที่ใช้เพิ่ม (กรณีใช้ไปครึ่งขวด)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <ActivityInput
                          type="number"
                          min="0"
                          value={prod.extraQuantity != null ? String(prod.extraQuantity) : ""}
                          onChange={(e) =>
                            handleUpdatePlannedProd(idx, "extraQuantity", e.target.value)
                          }
                          disabled={readonly}
                          placeholder="เช่น 250"
                        />
                        <ActivitySelect
                          value={prod.extraUnit || "ซีซี"}
                          onChange={(val) =>
                            handleUpdatePlannedProd(idx, "extraUnit", val)
                          }
                          options={[
                            { value: "ซีซี", label: "ซีซี (ขวด)" },
                            { value: "กรัม", label: "กรัม (ซอง)" },
                          ]}
                          disabled={readonly}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        อัตราการใช้ <span className="text-rose-500">*</span>
                      </label>
                      <ActivityInput
                        value={prod.applicationRate || ""}
                        onChange={(e) =>
                          handleUpdatePlannedProd(idx, "applicationRate", e.target.value)
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
        </section>

        {/* ========================================================================= */}
        {/* SECTION 6: สินค้าเพิ่มเติมในการปฏิบัติงาน (Additional Products)              */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <PackagePlus className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                6. สินค้าเพิ่มเติมในการปฏิบัติงาน (กรณีไม่ได้ใช้ยาที่เบิกไป)
              </h4>
            </div>

            {!readonly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddAdditionalProd}
                className="h-8 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                เพิ่มสินค้า
              </Button>
            )}
          </div>

          {additionalProductsList.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2 text-center bg-slate-50 rounded-xl">
              ยังไม่มีสินค้าเพิ่มเติมหน้างาน กดปุ่ม &quot;+ เพิ่มสินค้า&quot; หากมีการใช้ยาตัวอื่น
            </p>
          ) : (
            <div className="space-y-3">
              {additionalProductsList.map((prod, idx) => (
                <div
                  key={prod.id || idx}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      สินค้าเพิ่มเติมลำดับที่ {idx + 1}
                    </span>
                    {!readonly && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAdditionalProd(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                        title="ลบรายการ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <ActivityProductSelect
                      id={`additional-prod-${idx}`}
                      label="เลือกสินค้าจากระบบ"
                      value={prod.productId}
                      valueKey="id"
                      products={products as any}
                      onChange={(val, selected) => {
                        const resolvedId = selected?.id || val;
                        const resolvedName = selected?.name || prod.productName || "";
                        handleUpdateAdditionalProd(idx, "productId", resolvedId);
                        handleUpdateAdditionalProd(idx, "productName", resolvedName);
                        if (selected?.unit) {
                          const defaultExtra = selected.unit.includes("ซอง") ? "กรัม" : "ซีซี";
                          handleUpdateAdditionalProd(idx, "extraUnit", defaultExtra);
                        }
                      }}
                      disabled={readonly}
                      placeholder="ค้นหาและเลือกสินค้า..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        จำนวนที่ใช้จริง (ขวด) <span className="text-rose-500">*</span>
                      </label>
                      <ActivityInput
                        type="number"
                        min="0"
                        value={prod.actualQuantity != null ? String(prod.actualQuantity) : ""}
                        onChange={(e) =>
                          handleUpdateAdditionalProd(idx, "actualQuantity", e.target.value)
                        }
                        disabled={readonly}
                        placeholder="เช่น 1"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        ปริมาณที่ใช้เพิ่ม (กรณีใช้ไปครึ่งขวด)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <ActivityInput
                          type="number"
                          min="0"
                          value={prod.extraQuantity != null ? String(prod.extraQuantity) : ""}
                          onChange={(e) =>
                            handleUpdateAdditionalProd(idx, "extraQuantity", e.target.value)
                          }
                          disabled={readonly}
                          placeholder="เช่น 250"
                        />
                        <ActivitySelect
                          value={prod.extraUnit || "ซีซี"}
                          onChange={(val) =>
                            handleUpdateAdditionalProd(idx, "extraUnit", val)
                          }
                          options={[
                            { value: "ซีซี", label: "ซีซี (ขวด)" },
                            { value: "กรัม", label: "กรัม (ซอง)" },
                          ]}
                          disabled={readonly}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700">
                        อัตราการใช้ <span className="text-rose-500">*</span>
                      </label>
                      <ActivityInput
                        value={prod.applicationRate || ""}
                        onChange={(e) =>
                          handleUpdateAdditionalProd(idx, "applicationRate", e.target.value)
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
        </section>

        {/* ========================================================================= */}
        {/* SECTION 7: ภาพถ่ายสภาพแปลงเริ่มต้น (Initial Plot Photos)                    */}
        {/* ========================================================================= */}
        <section className="space-y-4 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2 pb-1">
            <Camera className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-800">
              7. ภาพถ่ายสภาพแปลงเริ่มต้น (Initial Plot Photos)
            </h4>
          </div>

          <ActivityPhotoUpload
            title="อัปโหลดรูปภาพสภาพแปลงเริ่มต้น (สูงสุด 10 รูป)"
            description="รูปถ่ายป้ายแปลง, แปลงทดสอบ, สภาพดิน หรือรูปถ่ายขณะลงมือสาธิตพ่นสาร"
            images={actualState.t7InitialPhotos || []}
            onImagesChange={(imgs) => onUpdateField?.("t7InitialPhotos", imgs)}
            maxFiles={10}
            accentColor="emerald"
            disabled={readonly}
          />
        </section>
      </div>
    </div>
  );
}

// Backward-compatible alias
export const ActualType7NewDemo = Type7aActualForm;
